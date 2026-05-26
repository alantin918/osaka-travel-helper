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

  // Currency Converter Logic
  const jpyInput = document.getElementById('jpy-input');
  const twdOutput = document.getElementById('twd-output');
  const rateInput = document.getElementById('rate-input');
  const applyBtn = document.getElementById('apply-to-calc');

  // Fetch live JPY to TWD exchange rate on load
  async function fetchLiveRate() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/JPY');
      const data = await response.json();
      if (data && data.rates && data.rates.TWD) {
        const rate = data.rates.TWD;
        rateInput.value = rate.toFixed(4);
        
        // Automatically calculate JPY 10,000 to TWD based on live rate
        const jpyVal = parseFloat(jpyInput.value) || 10000;
        twdOutput.value = Math.round(jpyVal * rate);
        
        // Trigger table update if initial value changes
        calculateCashback();
      }
    } catch (e) {
      console.warn('Failed to fetch live exchange rate, using fallback 0.2100:', e);
    }
  }
  fetchLiveRate();

  jpyInput.addEventListener('input', () => {
    const rate = parseFloat(rateInput.value) || 0.21;
    const jpy = parseFloat(jpyInput.value) || 0;
    twdOutput.value = Math.round(jpy * rate);
  });

  twdOutput.addEventListener('input', () => {
    const rate = parseFloat(rateInput.value) || 0.21;
    const twd = parseFloat(twdOutput.value) || 0;
    jpyInput.value = rate > 0 ? Math.round(twd / rate) : 0;
  });

  rateInput.addEventListener('input', () => {
    const rate = parseFloat(rateInput.value) || 0.21;
    const jpy = parseFloat(jpyInput.value) || 0;
    twdOutput.value = Math.round(jpy * rate);
  });

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
});
