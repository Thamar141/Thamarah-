const challengesConfig = {
    1: { name: " الصلاة على النبي", motivation: "من صل علي صلاة صل الله عليه بها عشرا\nوصلاة الله على الفرد هي توفيقه في دنياه وآخرته", type: "counter" },
    2: { name: "التبسم في وجه أخيك", motivation: "تبسمك في وجه اخيك صدقة", type: "boolean" },
    3: { name: "صلاة فريضة فوقتها", motivation: "إن الصلاة كانت على المؤمنين كتابا موقوتا", type: "prayers" },
    4: { name: "قراءة صفحة قرآن", motivation: "كل حرف تقرأه بحسنة والله يضاعف لمن يشاء", type: "counter" }
};

let appState = JSON.parse(localStorage.getItem('thamarat_v8_state')) || getInitialState();

function getInitialState() {
    return {
        streak: 0, 
        progress: {
            1: { unlocked: true, currentDay: 0, lastCompletedDate: "", tempCount: 0, isOpenHabit: false },
            2: { unlocked: false, currentDay: 0, lastCompletedDate: "", tempCount: 0, isOpenHabit: false },
            3: { unlocked: false, currentDay: 0, lastCompletedDate: [], tempPrays: [], isOpenHabit: false },
            4: { unlocked: false, currentDay: 0, lastCompletedDate: "", tempCount: 0, isOpenHabit: false }
        }
    };
}

let activeChallengeId = null;

function getTodayDateString() {
    const d = new Date();
    if (d.getHours() < 4) {
        d.setDate(d.getDate() - 1);
    }
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function fixAndMigrateState() {
    let updated = false;
    const todayStr = getTodayDateString();

    for (let i = 1; i <= 4; i++) {
        let prog = appState.progress[i];
        if (!prog) continue;

        if (prog.lastCompletedDate && !prog.isOpenHabit) {
            let hasDate = false;
            if (Array.isArray(prog.lastCompletedDate) && prog.lastCompletedDate.length > 0) hasDate = true;
            if (typeof prog.lastCompletedDate === "string" && prog.lastCompletedDate !== "") hasDate = true;

            if (hasDate && prog.currentDay === 0) {
                prog.currentDay = 1;
                updated = true;
            }
        }
    }

    let maxDay = 0;
    for (let i = 1; i <= 4; i++) {
        if (appState.progress[i] && appState.progress[i].currentDay > maxDay) {
            maxDay = appState.progress[i].currentDay;
        }
    }
    if (appState.streak < maxDay) {
        appState.streak = maxDay;
        updated = true;
    }

    if (updated) {
        localStorage.setItem('thamarat_v8_state', JSON.stringify(appState));
    }
}

fixAndMigrateState();

function getTargetForChallenge1(day) {
    if (day >= 18) return 500;
    if (day >= 12) return 400;
    if (day >= 7) return 300;
    if (day >= 3) return 200;
    return 100;
}

function getTargetForChallenge4(day) {
    if (day >= 18) return 5;
    if (day >= 15) return 4;
    if (day >= 12) return 3;
    if (day >= 5) return 2;
    return 1;
}

function enterApp() {
    fixAndMigrateState(); 
    showScreen('main-map');
    renderMap();
    checkNotificationVisuals();
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function renderMap() {
    document.getElementById('global-streak').innerText = appState.streak;
    
    const container = document.getElementById('map-container');
    container.querySelectorAll('.map-node').forEach(el => el.remove());

    const todayStr = getTodayDateString();

    for (let i = 1; i <= 10; i++) {
        const node = document.createElement('div');
        node.className = 'map-node';

        if (i <= 4) {
            let prog = appState.progress[i];
            
            let isDoneToday = false;
            if (Array.isArray(prog.lastCompletedDate)) {
                isDoneToday = prog.lastCompletedDate.includes(todayStr);
            } else {
                isDoneToday = (prog.lastCompletedDate === todayStr);
            }

            if (prog.isOpenHabit) {
                node.innerHTML = `<span>ثمرة ${i}</span>`;
                node.classList.add('open-habit');
                node.innerHTML += `<span class="node-info-text">التزام مفتوح</span>`;
                node.onclick = () => openChallengePage(i);
            } 
            else if (isDoneToday) {
                node.innerHTML = `<span>ثمرة ${i}</span>`;
                node.classList.add('done-today');
                node.innerHTML += `<span class="node-info-text"><i class="fas fa-check-circle"></i> تم اليوم</span>`;
                node.onclick = () => triggerModal("انتظر للغد ⏳", "لقد قطفت ثمرة هذه العادة اليوم بنجاح! عد بعد بداية اليوم التالي لتواصل رحلة نورك صاعداً.", "🌱");
            } 
            else if (prog.unlocked) {
                node.innerHTML = `<span>ثمرة ${i}</span>`;
                node.classList.add('unlocked');
                node.innerHTML += `<span class="node-info-text">يوم ${prog.currentDay}</span>`;
                node.onclick = () => openChallengePage(i);
            } 
            else {
                node.classList.add('locked');
                node.innerHTML = `
                    <div class="lock-icon-inside"><i class="fas fa-lock"></i></div>
                    <span>ثمرة ${i}</span>
                `;
                node.onclick = () => triggerModal("ثمرة مغلقة 🔒", "تُفتح تلقائياً بعد الالتزام بـ 10 أيام في الثمرة السابقة لها مباشرة.", "🎯");
            }
        } else {
            node.classList.add('locked');
            node.innerHTML = `
                <div class="lock-icon-inside"><i class="fas fa-lock"></i></div>
                <span>ثمرة ${i}</span>
            `;
            node.onclick = () => triggerModal("قريباً جداً", "هذه الثمرة ستنزل في التحديث القادم لإضافة المزيد من العادات الإيمانية الجميلة والخصائص الجديدة!", "🚀");
        }
        container.appendChild(node);
    }
}

function openChallengePage(id) {
    activeChallengeId = id;
    const config = challengesConfig[id];
    const prog = appState.progress[id];
    const area = document.getElementById('interactive-area');
    const submitBtn = document.getElementById('action-submit-btn');
    
    document.getElementById('challenge-title').innerText = `ثمرة ${id}: ${config.name}`;
    document.getElementById('challenge-motivation').innerText = config.motivation;

    area.innerHTML = "";
    submitBtn.style.display = "none";

    if (config.type === "counter") {
        let target = (id === 1) ? getTargetForChallenge1(prog.currentDay) : getTargetForChallenge4(prog.currentDay);
        if (prog.isOpenHabit) target = (id === 1) ? 500 : 5;
        
        area.innerHTML = `
            <div class="counter-section-fixed">
                <div class="counter-display-classic">
                    <span id="live-count">${prog.tempCount}</span> / <span class="target-num">${target}</span>
                </div>
                
                <div class="fast-click-row">
                    <button class="fast-btn" onclick="handleBeadClick(${target}, 10)">+١٠</button>
                    <button class="fast-btn" onclick="handleBeadClick(${target}, 50)">+٥٠</button>
                </div>

                <button class="subha-bead-classic" onclick="handleBeadClick(${target}, 1)"></button>
                
                <div class="day-status-text">اليوم الحالي: ${prog.isOpenHabit ? "مفتوح دائماً" : prog.currentDay}</div>
            </div>
        `;
    } 
    else if (config.type === "boolean") {
        area.innerHTML = `<div class="day-status-text-center">اليوم الحالي: ${prog.isOpenHabit ? "مفتوح دائماً" : prog.currentDay}</div>`;
        submitBtn.style.display = "block";
        submitBtn.innerText = "تبسمت في وجه أخي اليوم 😊";
        submitBtn.onclick = () => submitDailySuccess(1); 
    } 
    else if (config.type === "prayers") {
        submitBtn.style.display = "block";
        submitBtn.innerText = "تسجيل صلوات اليوم";
        
        let gridHtml = `<div class="day-status-text-center" style="margin-bottom:15px;">اليوم الحالي: ${prog.isOpenHabit ? "مفتوح دائماً" : prog.currentDay}</div>`;
        const prays = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
        gridHtml += `<div class="prayers-grid">`;
        prays.forEach((p, idx) => {
            const isChecked = prog.tempPrays && prog.tempPrays.includes(idx);
            gridHtml += `<div class="prayer-chip ${isChecked ? 'checked' : ''}" onclick="togglePrayer(this, ${idx})">${p}</div>`;
        });
        gridHtml += `</div>`;
        area.innerHTML = gridHtml;
        
        submitBtn.onclick = () => {
            let count = (prog.tempPrays) ? prog.tempPrays.length : 0;
            if (count === 0) {
                triggerModal("تنبيه", "من فضلك اختر صلاة واحدة على الأقل قمت بأدائها لتسجيل اليوم.", "⚠️");
                return;
            }
            submitDailySuccess(count);
        };
    }

    showScreen('challenge-screen');
}

function handleBeadClick(target, amount = 1) {
    let prog = appState.progress[activeChallengeId];
    prog.tempCount += amount;

    if (prog.tempCount > target) {
        prog.tempCount = target;
    }

    document.getElementById('live-count').innerText = prog.tempCount;
    localStorage.setItem('thamarat_v8_state', JSON.stringify(appState));

    if (navigator.vibrate) navigator.vibrate(40);

    if (prog.tempCount >= target) {
        setTimeout(() => {
            submitDailySuccess(prog.tempCount);
        }, 300);
    }
}

function togglePrayer(el, idx) {
    let prog = appState.progress[3];
    if (!prog.tempPrays) prog.tempPrays = [];

    if (prog.tempPrays.includes(idx)) {
        prog.tempPrays = prog.tempPrays.filter(i => i !== idx);
        el.classList.remove('checked');
    } else {
        prog.tempPrays.push(idx);
        el.classList.add('checked');
    }
    localStorage.setItem('thamarat_v8_state', JSON.stringify(appState));
}

function submitDailySuccess(scoreValue) {
    let prog = appState.progress[activeChallengeId];
    const todayStr = getTodayDateString();
    
    if (!prog.isOpenHabit) {
        if (activeChallengeId === 3) {
            if (!Array.isArray(prog.lastCompletedDate)) prog.lastCompletedDate = [];
            if (!prog.lastCompletedDate.includes(todayStr)) {
                prog.lastCompletedDate.push(todayStr);
                prog.currentDay++;
            }
        } else {
            if (prog.lastCompletedDate !== todayStr) {
                prog.lastCompletedDate = todayStr; 
                prog.currentDay++; 
            }
        }
    }

    let completedDay = prog.currentDay; 
    
    let maxDay = 0;
    for (let i = 1; i <= 4; i++) {
        if (appState.progress[i] && appState.progress[i].currentDay > maxDay) {
            maxDay = appState.progress[i].currentDay;
        }
    }
    appState.streak = maxDay;

    prog.tempCount = 0;
    if(prog.tempPrays) prog.tempPrays = [];
    
    localStorage.setItem('thamarat_v8_state', JSON.stringify(appState));
    checkMilestonesAndUnlocks(activeChallengeId, completedDay, scoreValue);
    renderMap();

    // التعديل: فحص فوري عند الحفظ لإرسال إشعار مباركة إذا تم إنهاء كل شيء
    checkHabitStatus(true);
}

function checkMilestonesAndUnlocks(id, completedDay, scoreValue = 5) {
    let prog = appState.progress[id];

    if (id === 1) {
        if (completedDay === 3) {
            triggerModal("تطور رائع! 📈", "أتممت 3 أيام بنجاح وتغلبت على تحدي الـ 200 صلاة على النبي اليوم! واصل صعودك القوي وعاداتك المباركة.", "📈");
        } else if (completedDay === 7) {
            triggerModal("ثبات عظيم! 💪", "ما شاء الله! 7 أيام كاملة من النور والالتزام بالصلاة على الحبيب، وتم اجتياز تحدي الـ 300 صلاة بنجاح!", "💪");
        } else if (completedDay === 10) {
            appState.progress[2].unlocked = true; 
            triggerModal("احتفالية الـ 10 أيام! 🌱", "يا لك من بطل! أتممت 10 أيام كاملة من الالتزام بالعادة الأولى، وتم فتح (ثمرة 2: التبسم في وجه أخيك) الآن على الخريطة لتبدأ رحلتها الكريمة.", "🌱");
        } else if (completedDay === 12) {
            triggerModal("مستوى جديد! 📈", "رائع جداً! أتممت 12 يوماً بنجاح وتجاوزت تحدي الـ 400 صلاة اليوم بكل همة وعزيمة!", "📈");
        } else if (completedDay === 18) {
            triggerModal("المرحلة المتقدمة! 👑", "أنت تقترب من القمة! 18 يوماً من الالتزام الباهر وتجاوز تحدي الـ 500 صلاة اليوم بنجاح خطوة بخطوة!", "👑");
        } else if (completedDay === 21) {
            prog.isOpenHabit = true; 
            triggerModal("احتفالية كبرى الختام! 🎉", "مبارك لك إتمام 21 يوماً كاملة بنجاح ساحق! أصبحت العادة متأصلة فيك وثبتت في قلبك، تم تفعيل وضع (الالتزام المفتوح) لثمرة 1 لتستخدم العداد في أي وقت دون قيود يومية!", "🏆");
        } else {
            triggerModal("ثمرة مباركة! ❤️", `تم تسجيل اليوم ${completedDay} بنجاح.\nالهدف القادم بانتظارك غداً بكل بركة ونور وهدوء نفسي!`, "🎉");
        }
    }
    else if (id === 2) {
        if (completedDay === 10) {
            appState.progress[3].unlocked = true; 
            triggerModal("احتفالية الـ 10 أيام! 🕌", "أتممت 10 أيام في ثمرة التبسم بنجاح ونشرت الخير! ونظراً لثباتك العظيم، تم فتح (ثمرة 3: الصلوات في وقتها) الآن على الخريطة لتكمل رحلتك الإيمانية.", "🕌");
        } else if (completedDay === 21) {
            prog.isOpenHabit = true;
            triggerModal("احتفالية كبرى! 😊", "مبارك! أكملت 21 يوماً من نشر البهجة والتبسم في وجوه الناس اقتداءً بنبيك الكريم! تم تفعيل وضع (الالتزام المفتوح) لهذه الثمرة العظيمة لتستمر كأسلوب حياة.", "🏆");
        } else {
            triggerModal("تبسمك صدقة 😊", `تم تسجيل إنجاز اليوم ${completedDay} بنجاح.\nيومك سعيد ومليء بالبهجة والأجور والبركات المضاعفة!`, "🎉");
        }
    }
    else if (id === 3) {
        let prayerMsg = "";
        let prayerIcon = "🕌";
        
        if (scoreValue === 5) {
            prayerMsg = "أنت رائع حقاً ومميز وجسور! حافظت على الصلوات الخمس كاملة في وقتها اليوم، هنيئاً لقلب تعلق بربه ونال نور الطاعة المكتمل والبركة العميقة التي ستلازم يومك وحياتك!";
            prayerIcon = "🕌";
        } else {
            prayerMsg = `تقبل الله طاعتك الصالحة! صليت ${scoreValue} صلوات في وقتها اليوم، وهذا مجهود كريم تشكر عليه. أنت بطل وقادر تماماً على تحقيق العلامة الكاملة وغرس الـ 5 صلوات كاملة في وقتها غداً.. همتك العالية معنا لتنال الأجر والثواب كاملاً!`;
            prayerIcon = "💚";
        }

        if (completedDay === 10) {
            appState.progress[4].unlocked = true; 
            triggerModal("احتفالية وتطور! 📖", `${prayerMsg}\n\n🎁 وبإتمامك لـ 10 أيام كاملة من هذا الثبات العظيم, تم فتح (ثمرة 4: ورد القرآن) الآن على الخريطة لتبدأ التلاوة المضيئة!`, "🎁");
        } else if (completedDay === 21) {
            prog.isOpenHabit = true;
            triggerModal("احتفالية كبرى! 👑", `${prayerMsg}\n\n🏆 يا له من إنجاز تاريخي لنفسك! 21 يوماً من الحفاظ الصارم على صلواتك! بارك الله فيك وحفظك، وتم تفعيل وضع (الالتزام المفتوح) لثمرة 3 لتابع صلواتك دائماً بمرونة برمجية كاملة.`, "🏆");
        } else {
            triggerModal("صلاتك حياتك 🕌", prayerMsg, prayerIcon);
        }
    }
    else if (id === 4) {
        if (completedDay === 5) {
            triggerModal("زيادة في الخير! 💚", "مستواك ارتفع! أتممت 5 أيام بنجاح وتجاوزت تحدي قراءة صفحتين من القرآن اليوم بنور وبركة وفهم واضح!", "💚");
        } else if (completedDay === 12) {
            triggerModal("مع القرآن! 📖", "أتممت 12 يوماً بنجاح وتجاوزت تحدي الـ 3 صفحات اليوم! زادك الله فهماً وحفظاً وتدبراً لآياته.", "📖");
        } else if (completedDay === 15) {
            triggerModal("زادك الله نوراً! 🌿", "أتممت 15 يوماً بنجاح وقرأت 4 صفحات من كلام الله عز وجل اليوم! هنيئاً لقلبك المستنير بالقرآن.", "🌿");
        } else if (completedDay === 18) {
            triggerModal("الهمة العالية! 🎯", "المرحلة المتقدمة! أتممت 18 يوماً وقرأت 5 صفحات كاملة اليوم! اقتربت جداً وبشدة من الختام التام للتحدي.", "🎯");
        } else if (completedDay === 21) {
            prog.isOpenHabit = true;
            triggerModal("احتفالية كبرى ختامية! 🎉", "مبارك إتمام 21 يوماً من ورد القرآن الكريم! أصبحت التلاوة العطرة جزءاً لا يتجزأ من يومك، تم تفعيل وضع (الالتزام المفتوح) لهذه الثمرة العظيمة لتنير دربك دائماً بغير قيود.", "🏆");
        } else {
            triggerModal("هنيئاً لك بكل حرف 📖", `تم تسجيل اليوم ${completedDay} بنجاح من تلاوة القرآن الكريم وعمران قلبك.\nالحسنة بعشر أمثالها والله يضاعف لمن يشاء!`, "📖");
        }
    }
}

function triggerModal(title, message, icon) {
    document.getElementById('alert-icon').innerHTML = icon;
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('custom-alert').classList.add('active'); 
    document.body.classList.add('modal-open');
}

function handleAlertClose() {
    closeAlert();
    showScreen('main-map');
}

function closeAlert() { 
    document.getElementById('custom-alert').classList.remove('active'); 
    document.body.classList.remove('modal-open');
}

function toggleInfoModal(show) {
    const modal = document.getElementById('info-modal');
    if (show) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    } else {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

function initNotificationSystem() {
    if (!("Notification" in window)) {
        triggerModal("تنبيه النظام", "متصفحك الحالي لا يدعم التنبيهات، ولكننا سنذكرك دائماً عند فتح البرنامج!", "⚠️");
        return;
    }

    if (Notification.permission === "granted") {
        triggerModal("مفعّلة بالفعل", "نظام تذكير ثمرة يتابعك يومياً بنجاح لضمان ثبات عاداتك الروحية.", "🔔");
        sendTestNotification();
    } 
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            checkNotificationVisuals();
            if (permission === "granted") {
                triggerModal("تم التفعيل بنجاح! 🎉", "سيصلك تذكير يومي لطيف من تطبيق ثَمَرَة لتجديد بركة يومك وعاداتك.", "🔔");
                sendTestNotification();
            }
        });
    } else {
        triggerModal("الإذن مرفوض", "من فضلك قم بتفعيل إذن الإشعارات من إعدادات المتصفح/الهاتف لتلقي التذكير اليومي.", "⚠️");
    }
}

function checkNotificationVisuals() {
    const btn = document.getElementById('noti-toggle-btn');
    if (btn && window.Notification && Notification.permission === "granted") {
        btn.classList.add('granted');
    }
}

function sendTestNotification() {
    const title = "تطبيق ثَمَرَة 🌱";
    const options = {
        body: "أهلاً بك في طريق النور، لا تنسَ قطف ثمرة عاداتك لليوم الحالي لزيادة بركة يومك!",
        icon: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/png/solid/seedling.png",
        vibrate: [200, 100, 200]
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, options);
        }).catch(() => {
            new Notification(title, options);
        });
    } else {
        new Notification(title, options);
    }
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        const options = {
            body: body,
            icon: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/png/solid/seedling.png',
            vibrate: [200, 100, 200]
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, options);
            }).catch(() => {
                new Notification(title, options);
            });
        } else {
            new Notification(title, options);
        }
    }
}

// دالة فحص المهمة وإرسال التذكير أو المباركة الفورية
function checkHabitStatus(isManualClick = false) {
    const todayStr = getTodayDateString();
    let allDone = true;

    for (let i = 1; i <= 4; i++) {
        let prog = appState.progress[i];
        if (prog && prog.unlocked) {
            let isDone = Array.isArray(prog.lastCompletedDate) 
                         ? prog.lastCompletedDate.includes(todayStr) 
                         : (prog.lastCompletedDate === todayStr);
            
            if (!isDone) {
                allDone = false;
                break;
            }
        }
    }

    if (allDone) {
        const lastWinNotify = localStorage.getItem('last_win_notify_date');
        if (lastWinNotify !== todayStr) {
            sendNotification("بطل ثَمَرَة! 🌟", "أحسنت، كل ثمار اليوم تم قطفها بنجاح! زادك الله نوراً.");
            localStorage.setItem('last_win_notify_date', todayStr);
        }
    } else {
        if (!isManualClick) { 
            const currentHour = new Date().getHours();
            const notificationTimes = [12, 17, 21]; // الظهر والمغرب وبالليل
            const lastRemindHour = parseInt(localStorage.getItem('last_remind_hour')) || -1;

            if (notificationTimes.includes(currentHour) && lastRemindHour !== currentHour) {
                sendNotification("تذكير ثَمَرَة 🌱", "يا بطل، لسه فيه ثمار إيمانية مخلصتش النهاردة.. مستني إيه؟");
                localStorage.setItem('last_remind_hour', currentHour);
            }
        }
    }
}

// طلب الإذن التلقائي الآمن عند الفتح
if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

// فحص ذكي هادئ بعد 10 ثوانٍ من دخول التطبيق
setTimeout(() => { checkHabitStatus(false); }, 10000);
