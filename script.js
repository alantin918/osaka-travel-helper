document.addEventListener('DOMContentLoaded', () => {
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
    { text: '購買威訊 eSIM (已選定 10GB 方案)', checked: false },
    { text: '線上投保旅遊險 (iCard.ai 比對)', checked: false },
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

  // Credit Card Calculator Logic
  const spendingInput = document.getElementById('spending-input');
  const tableBody = document.getElementById('table-body');

  const cardData = [
    { rank: 1, name: '玉山 熊本熊卡', rate: 0.085, limit: 8333, maxRebate: 708 },
    { rank: 2, name: '永豐 幣倍卡', rate: 0.060, limit: 20000, maxRebate: 1200 },
    { rank: 3, name: '中信 LINE Pay卡', rate: 0.050, limit: 20454, maxRebate: 1023 },
    { rank: 4, name: '星展 eco/極簡卡', rate: 0.050, limit: 15000, maxRebate: 750 },
    { rank: 5, name: '玉山 unicard', rate: 0.045, limit: 142857, maxRebate: 6429 },
    { rank: 6, name: '永豐 大戶卡', rate: 0.045, limit: 16000, maxRebate: 720 },
    { rank: 7, name: '國泰 CUBE卡', rate: 0.035, limit: Infinity, maxRebate: Infinity }
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
          💡 最佳策略：分配刷 $${Math.round(optimalAmt).toLocaleString()} (回饋 $${optimalRebate.toLocaleString()})
        </div>`;
      } else {
        splitDesc = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          💡 最佳策略：此金額下不需刷此卡
        </div>`;
      }

      const limitText = card.limit === Infinity ? '無上限' : `$${card.limit.toLocaleString()}`;
      const maxRebateText = card.maxRebate === Infinity ? '—' : `$${card.maxRebate.toLocaleString()}`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="rank-badge">${card.rank}</span></td>
        <td>
          <div class="card-name">${card.name}</div>
          ${splitDesc}
        </td>
        <td class="rebate-rate">${(card.rate * 100).toFixed(1)}%</td>
        <td>
          <div style="font-size: 0.9rem;">${limitText}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">最高回饋 ${maxRebateText}</div>
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
        splitSummaryList.push(`<li><strong>${card.name}</strong>：刷 $${Math.round(amt).toLocaleString()} 元，得回饋 $${reb.toLocaleString()} 元</li>`);
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
          🌟 最佳拆單刷卡方案建議 (總消費 $${Math.round(totalSpending).toLocaleString()} 元)
        </h3>
        <ul style="list-style: none; padding-left: 0; margin-bottom: 1rem; line-height: 1.8; font-size: 0.95rem;">
          ${splitSummaryList.join('')}
        </ul>
        <div style="font-size: 1.1rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between;">
          <span>最佳策略總回饋：</span>
          <span style="color: #10b981;">$${totalOptRebate.toLocaleString()} 元 (實質回饋率 ${(totalOptRebate / totalSpending * 100).toFixed(2)}%)</span>
        </div>
      `;
      summaryDiv.style.display = 'block';
    } else {
      summaryDiv.style.display = 'none';
    }
  }
});
