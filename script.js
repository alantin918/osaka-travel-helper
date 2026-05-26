document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching Logic
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // Update active button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Switch active content with transition
      tabContents.forEach(content => {
        if (content.id === `tab-${targetTab}`) {
          content.style.display = 'block';
          // Force reflow
          content.offsetHeight;
          content.classList.add('active');
        } else {
          content.classList.remove('active');
          content.style.display = 'none';
        }
      });
    });
  });

  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // Retrieve saved theme or default to dark mode
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      `;
    } else {
      themeToggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      `;
    }
  }

  // To-Do Checklist Logic (with LocalStorage)
  const todoList = document.getElementById('todo-list');
  const defaultTasks = [
    { text: '填寫 Visit Japan Web (入境海關申報)', checked: false },
    { text: '購買威訊 eSIM 或 翔翼日行卡', checked: false },
    { text: '線上投保旅遊險 (推薦新安東京 $496 元版)', checked: false },
    { text: '換取少量日幣現鈔', checked: false },
    { text: '下載大阪地鐵繁體中文 PDF 路線圖', checked: false },
    { text: '下載並註冊 USJ 官方 App', checked: false }
  ];

  let savedTasks = JSON.parse(localStorage.getItem('osaka_todo_tasks')) || defaultTasks;

  function renderChecklist() {
    todoList.innerHTML = '';
    savedTasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = `checklist-item ${task.checked ? 'checked' : ''}`;
      li.innerHTML = `
        <input type="checkbox" id="task-${index}" ${task.checked ? 'checked' : ''}>
        <label for="task-${index}" style="cursor: pointer;">
          <span>${task.text}</span>
        </label>
      `;
      
      // Bind checkbox change
      const checkbox = li.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        savedTasks[index].checked = e.target.checked;
        if (e.target.checked) {
          li.classList.add('checked');
        } else {
          li.classList.remove('checked');
        }
        localStorage.setItem('osaka_todo_tasks', JSON.stringify(savedTasks));
      });

      todoList.appendChild(li);
    });
  }
  renderChecklist();

  // Currency Converter Logic (with Twin Sync & Coupon Calculation)
  const jpyInput = document.getElementById('jpy-input');
  const twdOutput = document.getElementById('twd-output');
  const rateInput = document.getElementById('rate-input');
  const applyBtn = document.getElementById('apply-to-calc');

  const shoppingJpyInput = document.getElementById('shopping-jpy-input');
  const shoppingTwdOutput = document.getElementById('shopping-twd-output');
  const shoppingRateInput = document.getElementById('shopping-rate-input');
  const shoppingApplyBtn = document.getElementById('shopping-apply-to-calc');

  // Fetch live JPY to TWD exchange rate on load
  async function fetchLiveRate() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/JPY');
      const data = await response.json();
      if (data && data.rates && data.rates.TWD) {
        const rate = data.rates.TWD;
        rateInput.value = rate.toFixed(4);
        if (shoppingRateInput) shoppingRateInput.value = rate.toFixed(4);
        
        // Automatically calculate JPY 10,000 to TWD based on live rate
        const jpyVal = parseFloat(jpyInput.value) || 10000;
        twdOutput.value = Math.round(jpyVal * rate);
        if (shoppingTwdOutput) shoppingTwdOutput.value = Math.round(jpyVal * rate);
        
        // Trigger table update and coupon calculation if initial value changes
        calculateCashback();
        calculateCoupons();
      }
    } catch (e) {
      console.warn('Failed to fetch live exchange rate, using fallback 0.2100:', e);
    }
  }
  fetchLiveRate();

  // Helper: Twin Input Syncing
  function syncInputs(source) {
    if (source === 'prep-jpy') {
      const jpy = parseFloat(jpyInput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0.21;
      twdOutput.value = Math.round(jpy * rate);
      
      if (shoppingJpyInput) shoppingJpyInput.value = jpyInput.value;
      if (shoppingTwdOutput) shoppingTwdOutput.value = twdOutput.value;
    } else if (source === 'prep-twd') {
      const twd = parseFloat(twdOutput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0.21;
      jpyInput.value = rate > 0 ? Math.round(twd / rate) : 0;
      
      if (shoppingTwdOutput) shoppingTwdOutput.value = twdOutput.value;
      if (shoppingJpyInput) shoppingJpyInput.value = jpyInput.value;
    } else if (source === 'prep-rate') {
      const rate = parseFloat(rateInput.value) || 0.21;
      const jpy = parseFloat(jpyInput.value) || 0;
      twdOutput.value = Math.round(jpy * rate);
      
      if (shoppingRateInput) shoppingRateInput.value = rateInput.value;
      if (shoppingTwdOutput) shoppingTwdOutput.value = twdOutput.value;
    } else if (source === 'shop-jpy') {
      const jpy = parseFloat(shoppingJpyInput.value) || 0;
      const rate = parseFloat(shoppingRateInput.value) || 0.21;
      if (shoppingTwdOutput) shoppingTwdOutput.value = Math.round(jpy * rate);
      
      jpyInput.value = shoppingJpyInput.value;
      twdOutput.value = shoppingTwdOutput.value;
    } else if (source === 'shop-twd') {
      const twd = parseFloat(shoppingTwdOutput.value) || 0;
      const rate = parseFloat(shoppingRateInput.value) || 0.21;
      if (shoppingJpyInput) shoppingJpyInput.value = rate > 0 ? Math.round(twd / rate) : 0;
      
      twdOutput.value = shoppingTwdOutput.value;
      jpyInput.value = shoppingJpyInput.value;
    } else if (source === 'shop-rate') {
      const rate = parseFloat(shoppingRateInput.value) || 0.21;
      const jpy = parseFloat(shoppingJpyInput.value) || 0;
      if (shoppingTwdOutput) shoppingTwdOutput.value = Math.round(jpy * rate);
      
      rateInput.value = shoppingRateInput.value;
      twdOutput.value = shoppingTwdOutput.value;
    }
    
    // Trigger updates on dependant calculations
    calculateCashback();
    calculateCoupons();
  }

  // Bind input events
  jpyInput.addEventListener('input', () => syncInputs('prep-jpy'));
  twdOutput.addEventListener('input', () => syncInputs('prep-twd'));
  rateInput.addEventListener('input', () => syncInputs('prep-rate'));

  if (shoppingJpyInput) shoppingJpyInput.addEventListener('input', () => syncInputs('shop-jpy'));
  if (shoppingTwdOutput) shoppingTwdOutput.addEventListener('input', () => syncInputs('shop-twd'));
  if (shoppingRateInput) shoppingRateInput.addEventListener('input', () => syncInputs('shop-rate'));

  // Calculate official store coupons & discounts based on shopping JPY
  function calculateCoupons() {
    if (!shoppingJpyInput) return;
    const jpyVal = parseFloat(shoppingJpyInput.value) || 0;
    const rate = parseFloat(shoppingRateInput.value) || 0.21;

    // 1. Bic Camera (Threshold: 5,000 JPY for 10% taxfree)
    const bicPayApplianceEl = document.querySelector('[data-brand="bic-camera"][data-type="appliance"]');
    const bicPayCosmeticEl = document.querySelector('[data-brand="bic-camera"][data-type="cosmetic"]');
    const bicSavedEl = document.querySelector('.calc-val-saved[data-brand="bic-camera"]');

    if (jpyVal >= 5000) {
      const payAppliance = Math.round(jpyVal * 0.93);
      const payCosmetic = Math.round(jpyVal * 0.95);
      const savedJpy = Math.round(jpyVal * 0.10) + Math.round(jpyVal * 0.07);
      const savedTwd = Math.round(savedJpy * rate);
      
      if (bicPayApplianceEl) bicPayApplianceEl.innerText = `¥${payAppliance.toLocaleString()}`;
      if (bicPayCosmeticEl) bicPayCosmeticEl.innerText = `¥${payCosmetic.toLocaleString()}`;
      if (bicSavedEl) bicSavedEl.innerHTML = `¥${savedJpy.toLocaleString()} (約 NT$${savedTwd.toLocaleString()}) <span style="font-size: 0.72rem; color: #10b981; font-weight: normal; margin-left: 4px;">[已享免稅10%+折7%]</span>`;
    } else {
      const payAppliance = Math.round(jpyVal * 1.10);
      const payCosmetic = Math.round(jpyVal * 1.10);
      const diffToTaxfree = 5000 - jpyVal;
      
      if (bicPayApplianceEl) bicPayApplianceEl.innerText = `¥${payAppliance.toLocaleString()} (含稅)`;
      if (bicPayCosmeticEl) bicPayCosmeticEl.innerText = `¥${payCosmetic.toLocaleString()} (含稅)`;
      if (bicSavedEl) bicSavedEl.innerHTML = `<span style="color: var(--text-muted);">差 ¥${diffToTaxfree.toLocaleString()} 達免稅門檻</span>`;
    }

    // 2. Don Quijote (Threshold: 10,000 JPY for 10% taxfree + 5% discount)
    const donkiPayEl = document.querySelector('.calc-val-pay-jpy[data-brand="donki"]');
    const donkiSavedEl = document.querySelector('.calc-val-saved[data-brand="donki"]');
    const donkiBadgeEl = document.getElementById('donki-discount-badge');

    if (jpyVal >= 10000) {
      const payJpy = Math.round(jpyVal * 0.95);
      const savedJpy = Math.round(jpyVal * 0.10) + Math.round(jpyVal * 0.05);
      const savedTwd = Math.round(savedJpy * rate);
      if (donkiPayEl) donkiPayEl.innerText = `¥${payJpy.toLocaleString()}`;
      if (donkiSavedEl) donkiSavedEl.innerHTML = `¥${savedJpy.toLocaleString()} (約 NT$${savedTwd.toLocaleString()}) <span style="font-size: 0.72rem; color: #10b981; font-weight: normal; margin-left: 4px;">[已享免稅10%+折5%]</span>`;
      if (donkiBadgeEl) {
        donkiBadgeEl.innerText = '免稅10% + 折5%';
        donkiBadgeEl.style.backgroundColor = '';
        donkiBadgeEl.style.color = '';
      }
    } else if (jpyVal >= 5000) {
      const payJpy = jpyVal;
      const savedJpy = Math.round(jpyVal * 0.10);
      const savedTwd = Math.round(savedJpy * rate);
      const diffToDiscount = 10000 - jpyVal;
      if (donkiPayEl) donkiPayEl.innerText = `¥${payJpy.toLocaleString()}`;
      if (donkiSavedEl) donkiSavedEl.innerHTML = `¥${savedJpy.toLocaleString()} (約 NT$${savedTwd.toLocaleString()}) <br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${diffToDiscount.toLocaleString()} 享額外 5% 折扣</span>`;
      if (donkiBadgeEl) {
        donkiBadgeEl.innerText = '僅免稅 10%';
        donkiBadgeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        donkiBadgeEl.style.color = '#10b981';
      }
    } else {
      const payJpy = Math.round(jpyVal * 1.10);
      const diffToTaxfree = 5000 - jpyVal;
      if (donkiPayEl) donkiPayEl.innerText = `¥${payJpy.toLocaleString()} (含稅)`;
      if (donkiSavedEl) donkiSavedEl.innerHTML = `<span style="color: var(--text-muted);">差 ¥${diffToTaxfree.toLocaleString()} 達免稅門檻</span>`;
      if (donkiBadgeEl) {
        donkiBadgeEl.innerText = '滿 1 萬折 5%';
        donkiBadgeEl.style.backgroundColor = '';
        donkiBadgeEl.style.color = '';
      }
    }

    // 3. Matsumoto Kiyoshi (10k -> 3%, 30k -> 5%, 50k -> 7%)
    const matsumotoRateEl = document.querySelector('.calc-val-rate[data-brand="matsumoto"]');
    const matsumotoPayEl = document.querySelector('.calc-val-pay-jpy[data-brand="matsumoto"]');
    const matsumotoSavedEl = document.querySelector('.calc-val-saved[data-brand="matsumoto"]');
    const matsumotoBadgeEl = document.getElementById('matsumoto-discount-badge');

    let matsumotoDiscount = 0;
    if (jpyVal >= 50000) matsumotoDiscount = 0.07;
    else if (jpyVal >= 30000) matsumotoDiscount = 0.05;
    else if (jpyVal >= 10000) matsumotoDiscount = 0.03;

    if (jpyVal >= 5000) {
      const payJpy = Math.round(jpyVal * (1 - matsumotoDiscount));
      const savedJpy = Math.round(jpyVal * 0.10) + Math.round(jpyVal * matsumotoDiscount);
      const savedTwd = Math.round(savedJpy * rate);
      
      if (matsumotoRateEl) matsumotoRateEl.innerText = `${(matsumotoDiscount * 100).toFixed(0)}%`;
      if (matsumotoPayEl) matsumotoPayEl.innerText = `¥${payJpy.toLocaleString()}`;
      
      let nextStepTip = '';
      if (matsumotoDiscount === 0) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(10000 - jpyVal).toLocaleString()} 享折 3%</span>`;
      } else if (matsumotoDiscount === 0.03) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(30000 - jpyVal).toLocaleString()} 享折 5%</span>`;
      } else if (matsumotoDiscount === 0.05) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(50000 - jpyVal).toLocaleString()} 享折 7%</span>`;
      }

      if (matsumotoSavedEl) matsumotoSavedEl.innerHTML = `¥${savedJpy.toLocaleString()} (約 NT$${savedTwd.toLocaleString()}) <span style="font-size: 0.72rem; color: #10b981; font-weight: normal; margin-left: 4px;">[已享免稅+折${(matsumotoDiscount*100).toFixed(0)}%]</span>${nextStepTip}`;
      
      if (matsumotoBadgeEl) {
        if (matsumotoDiscount > 0) {
          matsumotoBadgeEl.innerText = `免稅10% + 折${(matsumotoDiscount*100).toFixed(0)}%`;
          matsumotoBadgeEl.style.backgroundColor = '';
          matsumotoBadgeEl.style.color = '';
        } else {
          matsumotoBadgeEl.innerText = `僅免稅 10%`;
          matsumotoBadgeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
          matsumotoBadgeEl.style.color = '#10b981';
        }
      }
    } else {
      if (matsumotoRateEl) matsumotoRateEl.innerText = '0%';
      if (matsumotoPayEl) matsumotoPayEl.innerText = `¥${Math.round(jpyVal * 1.10).toLocaleString()} (含稅)`;
      const diffToTaxfree = 5000 - jpyVal;
      if (matsumotoSavedEl) matsumotoSavedEl.innerHTML = `<span style="color: var(--text-muted);">差 ¥${diffToTaxfree.toLocaleString()} 達免稅門檻</span>`;
      if (matsumotoBadgeEl) {
        matsumotoBadgeEl.innerText = `滿額折 3%~7%`;
        matsumotoBadgeEl.style.backgroundColor = '';
        matsumotoBadgeEl.style.color = '';
      }
    }

    // 4. SUNDRUG (10k -> 3%, 30k -> 5%, 50k -> 7%)
    const sundrugRateEl = document.querySelector('.calc-val-rate[data-brand="sundrug"]');
    const sundrugPayEl = document.querySelector('.calc-val-pay-jpy[data-brand="sundrug"]');
    const sundrugSavedEl = document.querySelector('.calc-val-saved[data-brand="sundrug"]');
    const sundrugBadgeEl = document.getElementById('sundrug-discount-badge');

    let sundrugDiscount = 0;
    if (jpyVal >= 50000) sundrugDiscount = 0.07;
    else if (jpyVal >= 30000) sundrugDiscount = 0.05;
    else if (jpyVal >= 10000) sundrugDiscount = 0.03;

    if (jpyVal >= 5000) {
      const payJpy = Math.round(jpyVal * (1 - sundrugDiscount));
      const savedJpy = Math.round(jpyVal * 0.10) + Math.round(jpyVal * sundrugDiscount);
      const savedTwd = Math.round(savedJpy * rate);
      
      if (sundrugRateEl) sundrugRateEl.innerText = `${(sundrugDiscount * 100).toFixed(0)}%`;
      if (sundrugPayEl) sundrugPayEl.innerText = `¥${payJpy.toLocaleString()}`;
      
      let nextStepTip = '';
      if (sundrugDiscount === 0) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(10000 - jpyVal).toLocaleString()} 享折 3%</span>`;
      } else if (sundrugDiscount === 0.03) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(30000 - jpyVal).toLocaleString()} 享折 5%</span>`;
      } else if (sundrugDiscount === 0.05) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(50000 - jpyVal).toLocaleString()} 享折 7%</span>`;
      }

      if (sundrugSavedEl) sundrugSavedEl.innerHTML = `¥${savedJpy.toLocaleString()} (約 NT$${savedTwd.toLocaleString()}) <span style="font-size: 0.72rem; color: #10b981; font-weight: normal; margin-left: 4px;">[已享免稅+折${(sundrugDiscount*100).toFixed(0)}%]</span>${nextStepTip}`;
      
      if (sundrugBadgeEl) {
        if (sundrugDiscount > 0) {
          sundrugBadgeEl.innerText = `免稅10% + 折${(sundrugDiscount*100).toFixed(0)}%`;
          sundrugBadgeEl.style.backgroundColor = '';
          sundrugBadgeEl.style.color = '';
        } else {
          sundrugBadgeEl.innerText = `僅免稅 10%`;
          sundrugBadgeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
          sundrugBadgeEl.style.color = '#10b981';
        }
      }
    } else {
      if (sundrugRateEl) sundrugRateEl.innerText = '0%';
      if (sundrugPayEl) sundrugPayEl.innerText = `¥${Math.round(jpyVal * 1.10).toLocaleString()} (含稅)`;
      const diffToTaxfree = 5000 - jpyVal;
      if (sundrugSavedEl) sundrugSavedEl.innerHTML = `<span style="color: var(--text-muted);">差 ¥${diffToTaxfree.toLocaleString()} 達免稅門檻</span>`;
      if (sundrugBadgeEl) {
        sundrugBadgeEl.innerText = `滿額折 3%~7%`;
        sundrugBadgeEl.style.backgroundColor = '';
        sundrugBadgeEl.style.color = '';
      }
    }

    // 5. Daikoku Drug (30k -> 5%, 50k -> 7%)
    const daikokuRateEl = document.querySelector('.calc-val-rate[data-brand="daikoku"]');
    const daikokuPayEl = document.querySelector('.calc-val-pay-jpy[data-brand="daikoku"]');
    const daikokuSavedEl = document.querySelector('.calc-val-saved[data-brand="daikoku"]');
    const daikokuBadgeEl = document.getElementById('daikoku-discount-badge');

    let daikokuDiscount = 0;
    if (jpyVal >= 50000) daikokuDiscount = 0.07;
    else if (jpyVal >= 30000) daikokuDiscount = 0.05;

    if (jpyVal >= 5000) {
      const payJpy = Math.round(jpyVal * (1 - daikokuDiscount));
      const savedJpy = Math.round(jpyVal * 0.10) + Math.round(jpyVal * daikokuDiscount);
      const savedTwd = Math.round(savedJpy * rate);
      
      if (daikokuRateEl) daikokuRateEl.innerText = `${(daikokuDiscount * 100).toFixed(0)}%`;
      if (daikokuPayEl) daikokuPayEl.innerText = `¥${payJpy.toLocaleString()}`;
      
      let nextStepTip = '';
      if (daikokuDiscount === 0) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(30000 - jpyVal).toLocaleString()} 享折 5%</span>`;
      } else if (daikokuDiscount === 0.05) {
        nextStepTip = `<br><span style="font-size: 0.72rem; color: var(--text-muted);">再買 ¥${(50000 - jpyVal).toLocaleString()} 享折 7%</span>`;
      }

      if (daikokuSavedEl) daikokuSavedEl.innerHTML = `¥${savedJpy.toLocaleString()} (約 NT$${savedTwd.toLocaleString()}) <span style="font-size: 0.72rem; color: #10b981; font-weight: normal; margin-left: 4px;">[已享免稅+折${(daikokuDiscount*100).toFixed(0)}%]</span>${nextStepTip}`;
      
      if (daikokuBadgeEl) {
        if (daikokuDiscount > 0) {
          daikokuBadgeEl.innerText = `免稅10% + 折${(daikokuDiscount*100).toFixed(0)}%`;
          daikokuBadgeEl.style.backgroundColor = '';
          daikokuBadgeEl.style.color = '';
        } else {
          daikokuBadgeEl.innerText = `僅免稅 10%`;
          daikokuBadgeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
          daikokuBadgeEl.style.color = '#10b981';
        }
      }
    } else {
      if (daikokuRateEl) daikokuRateEl.innerText = '0%';
      if (daikokuPayEl) daikokuPayEl.innerText = `¥${Math.round(jpyVal * 1.10).toLocaleString()} (含稅)`;
      const diffToTaxfree = 5000 - jpyVal;
      if (daikokuSavedEl) daikokuSavedEl.innerHTML = `<span style="color: var(--text-muted);">差 ¥${diffToTaxfree.toLocaleString()} 達免稅門檻</span>`;
      if (daikokuBadgeEl) {
        daikokuBadgeEl.innerText = `滿額折 5%~7%`;
        daikokuBadgeEl.style.backgroundColor = '';
        daikokuBadgeEl.style.color = '';
      }
    }
  }

  // Bind applying converted TWD value from shopping calculator to spending input
  if (shoppingApplyBtn) {
    shoppingApplyBtn.addEventListener('click', () => {
      if (shoppingTwdOutput) {
        spendingInput.value = shoppingTwdOutput.value;
        calculateCashback();
      }
      
      // Automatically switch to tab-finance
      const financeTabBtn = document.querySelector('.tab-btn[data-tab="finance"]');
      if (financeTabBtn) {
        financeTabBtn.click();
      }
      
      // Scroll smoothly to credit card section
      setTimeout(() => {
        const ccSection = document.getElementById('credit-card-section');
        if (ccSection) {
          ccSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    });
  }

  // Credit Card & E-Payment Calculator Logic (Guaranteed/Conservative Mode - Excludes limited bank-specific extra bonuses)
  const spendingInput = document.getElementById('spending-input');
  const tableBody = document.getElementById('table-body');

  const cardData = [
    { rank: 1, name: '玉山 熊本熊卡 (JCB 刷卡/Apple Pay) 💳', type: 'card', rate: 0.070, limit: 8333, maxRebate: 583, feeDesc: '標示 8.5% 扣 1.5% 海外手續費 (100% 穩拿，首選防線)' },
    { rank: 2, name: '永豐 幣倍卡 (實體刷卡) 💳', type: 'card', rate: 0.045, limit: 20000, maxRebate: 900, feeDesc: '標示 6.0% 扣 1.5% 海外手續費 (100% 穩拿)' },
    { rank: 3, name: '全支付 (基本無加碼/帳戶扣款) 📱', type: 'epay', rate: 0.035, limit: 3428, maxRebate: 120, feeDesc: '免 1.5% 手續費 (基本盤 3.5%，假設無銀行加碼)' },
    { rank: 4, name: '街口支付 (綁台新街口聯名卡) 📱', type: 'epay', rate: 0.035, limit: 333333, maxRebate: 11666, feeDesc: '免 1.5% 手續費 (高額度上限 3.5%)' },
    { rank: 5, name: '中信 LINE Pay卡 💳', type: 'card', rate: 0.035, limit: 20454, maxRebate: 716, feeDesc: '標示 5.0% 扣 1.5% 海外手續費' },
    { rank: 6, name: '星展 eco/極簡卡 💳', type: 'card', rate: 0.035, limit: 15000, maxRebate: 525, feeDesc: '標示 5.0% 扣 1.5% 海外手續費' },
    { rank: 7, name: '玉山 unicard 💳', type: 'card', rate: 0.030, limit: 142857, maxRebate: 4286, feeDesc: '標示 4.5% 扣 1.5% 海外手續費' },
    { rank: 8, name: '永豐 大戶卡 💳', type: 'card', rate: 0.030, limit: 16000, maxRebate: 480, feeDesc: '標示 4.5% 扣 1.5% 海外手續費' },
    { rank: 9, name: '國泰 CUBE卡 💳', type: 'card', rate: 0.020, limit: Infinity, maxRebate: Infinity, feeDesc: '標示 3.5% 扣 1.5% 海外手續費' }
  ];

  spendingInput.addEventListener('input', calculateCashback);

  // Bind applying converted TWD value to spending input
  applyBtn.addEventListener('click', () => {
    spendingInput.value = twdOutput.value;
    calculateCashback();
    // Scroll smoothly to credit card section
    document.getElementById('credit-card-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Initial calculation
  calculateCashback();

  function calculateCashback() {
    const totalSpending = parseFloat(spendingInput.value) || 0;
    tableBody.innerHTML = '';

    // Calculate individual card values and optimal split
    let remainingSpending = totalSpending;
    const optimalSplits = {};

    // Compute optimal path based on descending ranking
    cardData.forEach(card => {
      if (remainingSpending <= 0) {
        optimalSplits[card.rank] = 0;
      } else if (card.limit === Infinity) {
        optimalSplits[card.rank] = remainingSpending;
        remainingSpending = 0;
      } else {
        const spendOnThisCard = Math.min(remainingSpending, card.limit);
        optimalSplits[card.rank] = spendOnThisCard;
        remainingSpending -= spendOnThisCard;
      }
    });

    cardData.forEach(card => {
      // Calculate rebate for this card if all spent on it
      let singleRebate = 0;
      let statusHtml = '';
      
      if (card.limit === Infinity) {
        singleRebate = Math.round(totalSpending * card.rate);
        statusHtml = `<span class="status-badge status-normal">無上限</span>`;
      } else {
        if (totalSpending >= card.limit) {
          singleRebate = card.maxRebate;
          statusHtml = `<span class="status-badge status-capped">已達上限</span>`;
        } else {
          singleRebate = Math.round(totalSpending * card.rate);
          statusHtml = `<span class="status-badge status-normal">額度內</span>`;
        }
      }

      // Format optimal split description
      const optimalAmt = optimalSplits[card.rank];
      const optimalRebate = Math.round(optimalAmt * card.rate);
      let splitDesc = '';
      if (optimalAmt > 0) {
        splitDesc = `<div style="font-size: 0.8rem; color: var(--accent-color); margin-top: 4px;">
          💡 最佳策略：分配在此管道付款 $${Math.round(optimalAmt).toLocaleString()} (實質淨得 $${optimalRebate.toLocaleString()} 元)
        </div>`;
      } else {
        splitDesc = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          💡 最佳策略：此金額下暫不需要使用
        </div>`;
      }

      const limitText = card.limit === Infinity ? '無上限' : `$${card.limit.toLocaleString()}`;
      const maxRebateText = card.maxRebate === Infinity ? '—' : `$${card.maxRebate.toLocaleString()}`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="rank-badge">${card.rank}</span></td>
        <td>
          <div class="card-name">${card.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${card.feeDesc}</div>
          ${splitDesc}
        </td>
        <td class="rebate-rate">${(card.rate * 100).toFixed(1)}%</td>
        <td>
          <div style="font-size: 0.9rem;">${limitText}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">最高淨得 ${maxRebateText}</div>
        </td>
        <td>
          <span class="rebate-value-dynamic">$${singleRebate.toLocaleString()}</span>
        </td>
        <td>${statusHtml}</td>
      `;
      tableBody.appendChild(row);
    });

    // Add summary panel at the bottom of the table
    let totalOptRebate = 0;
    let splitSummaryList = [];
    cardData.forEach(card => {
      const amt = optimalSplits[card.rank];
      if (amt > 0) {
        const reb = Math.round(amt * card.rate);
        totalOptRebate += reb;
        splitSummaryList.push(`<li><strong>${card.name}</strong>：刷/付 $${Math.round(amt).toLocaleString()} 元，得實質回饋 $${reb.toLocaleString()} 元</li>`);
      }
    });

    // Append optimal split result summary card if not existing
    let summaryDiv = document.getElementById('optimal-summary-box');
    if (!summaryDiv) {
      summaryDiv = document.createElement('div');
      summaryDiv.id = 'optimal-summary-box';
      summaryDiv.style.marginTop = '2rem';
      summaryDiv.style.padding = '1.5rem';
      summaryDiv.style.borderRadius = '16px';
      summaryDiv.style.backgroundColor = 'var(--bg-primary)';
      summaryDiv.style.border = '1px dashed var(--accent-color)';
      document.getElementById('credit-card-section').appendChild(summaryDiv);
    }

    if (totalSpending > 0) {
      summaryDiv.innerHTML = `
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; color: var(--accent-color);">
          🛡️ 保守/穩拿版 最佳拆單與消費建議 (總消費 $${Math.round(totalSpending).toLocaleString()} 元)
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">※已扣除銀行限量加碼，採用 100% 穩拿的基礎回饋與信用卡做最安全的防守配置。</p>
        <ul style="list-style: none; padding-left: 0; margin-bottom: 1rem; line-height: 1.8; font-size: 0.95rem;">
          ${splitSummaryList.join('')}
        </ul>
        <div style="font-size: 1.1rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between;">
          <span>穩拿策略實質總淨回饋：</span>
          <span style="color: #10b981;">$${totalOptRebate.toLocaleString()} 元 (實質平均回饋率 ${(totalOptRebate / totalSpending * 100).toFixed(2)}%)</span>
        </div>
      `;
      summaryDiv.style.display = 'block';
    } else {
      summaryDiv.style.display = 'none';
    }
  }

  // --- A. Live Osaka Weather API ---
  const weatherStatusEl = document.getElementById('live-weather-status');
  async function fetchLiveWeather() {
    if (!weatherStatusEl) return;
    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=34.6937&longitude=135.5023&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&timezone=Asia%2FTokyo');
      const data = await response.json();
      if (data && data.current) {
        const temp = Math.round(data.current.temperature_2m);
        const humidity = data.current.relative_humidity_2m;
        const apparent = Math.round(data.current.apparent_temperature);
        const code = data.current.weather_code;
        
        let weatherDesc = '晴朗';
        let weatherIcon = '☀️';
        if (code >= 1 && code <= 3) { weatherDesc = '多雲'; weatherIcon = '⛅'; }
        else if (code >= 51 && code <= 67) { weatherDesc = '毛毛雨'; weatherIcon = '🌦️'; }
        else if (code >= 71 && code <= 82) { weatherDesc = '陣雨/雨天'; weatherIcon = '🌧️'; }
        else if (code >= 95) { weatherDesc = '雷雨'; weatherIcon = '⛈️'; }

        let tip = '天氣晴朗，適合戶外行程！';
        if (temp > 27) tip = '天氣悶熱，注意補充水分，防曬防中暑！';
        if (code >= 51) tip = '今日有雨，建議攜帶雨具，多安排室內行程。';

        weatherStatusEl.innerHTML = `
          <div style="background: var(--highlight-row); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">大阪即時氣象看板</div>
              <div style="font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.15rem;">
                <span>${weatherIcon} ${temp}°C</span>
                <span style="font-size: 0.88rem; font-weight: 500; color: var(--text-secondary);">${weatherDesc} (體感 ${apparent}°C)</span>
              </div>
            </div>
            <div style="text-align: right; max-width: 60%; font-size: 0.8rem; line-height: 1.4; color: var(--accent-color); font-weight: 600;">
              💡 提醒：${tip}
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching live weather:', err);
      weatherStatusEl.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">無法載入大阪即時氣象，請參考下方中長期梅雨預報。</p>`;
    }
  }
  fetchLiveWeather();

  // --- B. Visit Japan Web (VJW) Memo Logic ---
  const vjwInputs = ['vjw-hotel', 'vjw-zip', 'vjw-address', 'vjw-phone'];
  vjwInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = localStorage.getItem(`osaka_${id}`) || '';
      el.addEventListener('input', (e) => {
        localStorage.setItem(`osaka_${id}`, e.target.value);
      });
    }
  });

  const copyButtons = document.querySelectorAll('.btn-copy-vjw');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const inputEl = document.getElementById(targetId);
      if (inputEl) {
        inputEl.select();
        inputEl.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(inputEl.value).then(() => {
          const originalText = btn.innerText;
          btn.innerText = '已複製！';
          btn.style.backgroundColor = '#10b981';
          btn.style.color = '#ffffff';
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
          }, 1200);
        });
      }
    });
  });
});
