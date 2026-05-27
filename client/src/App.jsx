import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const defaultCategories = [
  { name: 'Life Infrastructure', color: '#22C55E' },
  { name: 'Future Me', color: '#3B82F6' },
  { name: 'Performance & Growth', color: '#A855F7' },
  { name: 'Relationships & Generosity', color: '#F59E0B' },
  { name: 'Lifestyle Enjoyment', color: '#EF4444' },
]

const defaultPaymentMethods = [
  { name: 'Credit Card' },
  { name: 'Debit Card' },
  { name: 'UPI' },
  { name: 'Cash' },
  { name: 'Bank Transfer' },
]

const emptyAuth = {
  name: '',
  email: '',
  phone: '',
  password: '',
}

const emptyExpense = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  category: 'Life Infrastructure',
  amount: '',
  paymentMode: 'UPI',
  type: 'Need',
  notes: '',
}

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const toDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const parseInputDate = (value) => new Date(`${value}T00:00:00`)

const getDefaultWeeklyRange = () => {
  const today = new Date()
  const dayFromMonday = (today.getDay() + 6) % 7
  const start = new Date(today)
  start.setDate(today.getDate() - dayFromMonday)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  }
}

const getDefaultMonth = () => toDateInputValue(new Date()).slice(0, 7)

const formatPercent = (value) => `${value.toFixed(2)}%`

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const getDaysInMonth = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()

  return Array.from({ length: days }, (_, index) => new Date(year, month - 1, index + 1))
}

const formatDayLabel = (date) => date.toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
})

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data
}

function App() {
  const [mode, setMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [setup, setSetup] = useState({
    yearlyBudgets: [
      {
        year: new Date().getFullYear(),
        salary: '',
        allocation: { needs: 50, wants: 30, savings: 20 },
      },
      {
        year: new Date().getFullYear() + 1,
        salary: '',
        allocation: { needs: 50, wants: 30, savings: 20 },
      },
    ],
    categories: defaultCategories,
    paymentMethods: defaultPaymentMethods,
  })
  const [expenseForm, setExpenseForm] = useState(emptyExpense)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [appPage, setAppPage] = useState('add-expense')
  const [transactionMonth, setTransactionMonth] = useState(getDefaultMonth)
  const [monthlyMonth, setMonthlyMonth] = useState(getDefaultMonth)
  const [weeklyRange, setWeeklyRange] = useState(getDefaultWeeklyRange)

  const activeProfile = profile || user
  const isSetupDone = Boolean(activeProfile?.isProfileSetupComplete)

  const currentBudget = useMemo(() => {
    const year = new Date().getFullYear()
    return activeProfile?.yearlyBudgets?.find((budget) => budget.year === year)
      || activeProfile?.yearlyBudgets?.[0]
  }, [activeProfile])

  const totals = useMemo(() => {
    return expenses.reduce(
      (summary, expense) => {
        summary.total += expense.amount
        summary[expense.type] += expense.amount
        return summary
      },
      { total: 0, Need: 0, Want: 0, Saving: 0 },
    )
  }, [expenses])

  const weeklyAnalysis = useMemo(() => {
    const startDate = parseInputDate(weeklyRange.startDate)
    const endDate = parseInputDate(weeklyRange.endDate)
    endDate.setHours(23, 59, 59, 999)

    const weeklyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate && expenseDate <= endDate
    })

    const categoryTotals = weeklyExpenses.reduce((summary, expense) => {
      if (!summary[expense.category]) {
        summary[expense.category] = {
          category: expense.category,
          actual: 0,
          types: { Need: 0, Want: 0, Saving: 0 },
        }
      }

      summary[expense.category].actual += expense.amount
      summary[expense.category].types[expense.type] += expense.amount
      return summary
    }, {})

    const categoryRows = Object.values(categoryTotals)
      .map((row) => {
        const topType = Object.entries(row.types)
          .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount)[0]?.[0] || 'Need'

        return {
          category: row.category,
          actual: row.actual,
          type: topType,
        }
      })
      .sort((first, second) => second.actual - first.actual)

    const allocation = {
      needs: currentBudget?.allocation?.needs || 50,
      wants: currentBudget?.allocation?.wants || 30,
      savings: currentBudget?.allocation?.savings || 20,
    }
    const salary = currentBudget?.salary || 0
    const budgetByType = {
      Need: (salary * allocation.needs) / 100 / 4,
      Want: (salary * allocation.wants) / 100 / 4,
      Saving: (salary * allocation.savings) / 100 / 4,
    }

    const actualByType = weeklyExpenses.reduce(
      (summary, expense) => {
        summary[expense.type] += expense.amount
        return summary
      },
      { Need: 0, Want: 0, Saving: 0 },
    )

    const typeRows = ['Need', 'Want', 'Saving'].map((type) => ({
      type,
      budget: budgetByType[type],
      actual: actualByType[type],
      difference: budgetByType[type] - actualByType[type],
    }))

    const weeklyLimit = budgetByType.Need + budgetByType.Want
    const spendAgainstLimit = actualByType.Need + actualByType.Want
    const amountLeft = weeklyLimit - spendAgainstLimit

    return {
      amountLeft,
      categoryRows,
      percentageLeft: weeklyLimit ? (amountLeft / weeklyLimit) * 100 : 0,
      totalActual: weeklyExpenses.reduce((total, expense) => total + expense.amount, 0),
      typeRows,
      weeklyLimit,
    }
  }, [currentBudget, expenses, weeklyRange])

  const monthlyTransactions = useMemo(() => {
    return expenses
      .filter((expense) => toDateInputValue(new Date(expense.date)).startsWith(transactionMonth))
      .sort((first, second) => new Date(second.date) - new Date(first.date))
  }, [expenses, transactionMonth])

  const monthlyAnalysis = useMemo(() => {
    const [selectedYear, selectedMonth] = monthlyMonth.split('-').map(Number)
    const selectedBudget = activeProfile?.yearlyBudgets?.find((budget) => budget.year === selectedYear)
      || currentBudget
    const allocation = {
      needs: selectedBudget?.allocation?.needs || 50,
      wants: selectedBudget?.allocation?.wants || 30,
      savings: selectedBudget?.allocation?.savings || 20,
    }
    const monthlyLimit = selectedBudget
      ? ((selectedBudget.salary * allocation.needs) / 100 + (selectedBudget.salary * allocation.wants) / 100) / 12
      : 0

    const monthExpenses = expenses.filter((expense) => toDateInputValue(new Date(expense.date)).startsWith(monthlyMonth))
    const dailyTotals = monthExpenses.reduce((summary, expense) => {
      const key = toDateInputValue(new Date(expense.date))
      summary[key] = (summary[key] || 0) + expense.amount
      return summary
    }, {})

    const categoryTotals = monthExpenses.reduce((summary, expense) => {
      summary[expense.category] = (summary[expense.category] || 0) + expense.amount
      return summary
    }, {})
    const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const categories = activeProfile?.categories || defaultCategories
    const categoryRows = Object.entries(categoryTotals)
      .map(([category, actual]) => ({
        actual,
        category,
        color: categories.find((item) => item.name === category)?.color || '#A855F7',
        percent: total ? (actual / total) * 100 : 0,
      }))
      .sort((first, second) => second.actual - first.actual)

    return {
      categoryRows,
      days: getDaysInMonth(monthlyMonth).map((date) => ({
        date,
        key: toDateInputValue(date),
        spent: dailyTotals[toDateInputValue(date)] || 0,
      })),
      monthName: monthNames[selectedMonth - 1],
      score: monthlyLimit ? Math.max(0, Math.min(10, (1 - total / monthlyLimit) * 10 + 5)).toFixed(1) : '0.0',
      total,
      year: selectedYear,
    }
  }, [activeProfile, currentBudget, expenses, monthlyMonth])

  const loadSession = async () => {
    try {
      const { user: currentUser } = await apiRequest('/api/auth/me')
      setUser(currentUser)

      if (currentUser.isProfileSetupComplete) {
        await loadProfileAndExpenses()
      }
    } catch {
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const loadProfileAndExpenses = async () => {
    const [{ user: profileUser }, { expenses: userExpenses }] = await Promise.all([
      apiRequest('/api/user/profile'),
      apiRequest('/api/expenses'),
    ])
    setProfile(profileUser)
    setExpenses(userExpenses)
    setExpenseForm((form) => ({
      ...form,
      category: profileUser.categories?.[0]?.name || form.category,
      paymentMode: profileUser.paymentMethods?.[0]?.name || form.paymentMode,
    }))
  }

  useEffect(() => {
    loadSession()
  }, [])

  const submitAuth = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm
      const { user: authUser } = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setUser(authUser)
      setProfile(null)
      setMessage(mode === 'login' ? 'Welcome back.' : 'Account created.')

      if (authUser.isProfileSetupComplete) {
        await loadProfileAndExpenses()
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitSetup = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const payload = {
        ...setup,
        yearlyBudgets: setup.yearlyBudgets
          .filter((budget) => budget.year && budget.salary !== '')
          .map((budget) => ({
            ...budget,
            year: Number(budget.year),
            salary: Number(budget.salary),
            allocation: {
              needs: Number(budget.allocation.needs),
              wants: Number(budget.allocation.wants),
              savings: Number(budget.allocation.savings),
            },
          })),
      }
      const { user: setupUser } = await apiRequest('/api/user/setup-profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setUser(setupUser)
      setProfile(setupUser)
      setMessage('Setup saved.')
      await loadProfileAndExpenses()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitExpense = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const payload = {
        ...expenseForm,
        amount: Number(expenseForm.amount),
      }
      const { expense } = await apiRequest(
        editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses',
        {
          method: editingExpenseId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      setExpenses((items) => {
        if (editingExpenseId) {
          return items.map((item) => (item._id === editingExpenseId ? expense : item))
        }

        return [expense, ...items]
      })
      setExpenseForm((form) => ({
        ...emptyExpense,
        category: form.category,
        paymentMode: form.paymentMode,
      }))
      setMessage(editingExpenseId ? 'Expense updated.' : 'Expense added.')
      setEditingExpenseId(null)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEditExpense = (expense) => {
    setEditingExpenseId(expense._id)
    setAppPage('add-expense')
    setExpenseForm({
      date: new Date(expense.date).toISOString().slice(0, 10),
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      paymentMode: expense.paymentMode,
      type: expense.type,
      notes: expense.notes || '',
    })
    setMessage('')
  }

  const cancelEditExpense = () => {
    setEditingExpenseId(null)
    setExpenseForm((form) => ({
      ...emptyExpense,
      category: form.category,
      paymentMode: form.paymentMode,
    }))
    setMessage('')
  }

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) {
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      await apiRequest(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })
      setExpenses((items) => items.filter((item) => item._id !== expenseId))

      if (editingExpenseId === expenseId) {
        cancelEditExpense()
      }

      setMessage('Expense deleted.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const logout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST', body: '{}' })
    setUser(null)
    setProfile(null)
    setExpenses([])
    setMessage('')
  }

  const updateSetupBudget = (index, field, value) => {
    setSetup((state) => ({
      ...state,
      yearlyBudgets: state.yearlyBudgets.map((budget, budgetIndex) => {
        if (budgetIndex !== index) return budget

        if (field in budget.allocation) {
          return {
            ...budget,
            allocation: {
              ...budget.allocation,
              [field]: value,
            },
          }
        }

        return {
          ...budget,
          [field]: value,
        }
      }),
    }))
  }

  const addBudgetYear = () => {
    setSetup((state) => ({
      ...state,
      yearlyBudgets: [
        ...state.yearlyBudgets,
        {
          year: Number(state.yearlyBudgets.at(-1)?.year || new Date().getFullYear()) + 1,
          salary: '',
          allocation: { needs: 50, wants: 30, savings: 20 },
        },
      ],
    }))
  }

  if (loading) {
    return (
      <main className="app-shell center-shell">
        <div className="loader"><FiRefreshCw /> Loading Velrix</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="app-shell auth-shell">
        <motion.section
          className="auth-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="brand-row">
            <div className="brand-mark"><FiShield /></div>
            <span>Velrix</span>
          </div>
          <h1>Track money without losing the plot.</h1>
          <p className="muted">A clean expense workspace for budgets, weekly limits, and daily spending.</p>
          <div className="metric-strip">
            <span><FiTrendingUp /> Needs</span>
            <span><FiDollarSign /> Wants</span>
            <span><FiCreditCard /> Savings</span>
          </div>
        </motion.section>

        <motion.form
          className="glass-form"
          onSubmit={submitAuth}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Login
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
              Register
            </button>
          </div>

          {mode === 'register' && (
            <>
              <label>Name<input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>
              <label>Phone<input value={authForm.phone} onChange={(event) => setAuthForm({ ...authForm, phone: event.target.value })} /></label>
            </>
          )}

          <label>Email<input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
          <label>Password<input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>

          <button className="primary-btn" disabled={submitting}>
            {submitting ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'} <FiArrowRight />
          </button>
          {message && <p className="form-message">{message}</p>}
        </motion.form>
      </main>
    )
  }

  if (!isSetupDone) {
    return (
      <main className="app-shell setup-shell">
        <TopBar user={user} onLogout={logout} />
        <form className="setup-grid" onSubmit={submitSetup}>
          <section className="page-heading">
            <span className="eyebrow">Initial setup</span>
            <h1>Plan your year before tracking the week.</h1>
          </section>

          <section className="glass-section wide">
            <div className="section-title">
              <h2>Yearly budgets</h2>
              <button type="button" className="icon-btn text-btn" onClick={addBudgetYear}><FiPlus /> Year</button>
            </div>
            <div className="budget-list">
              {setup.yearlyBudgets.map((budget, index) => (
                <div className="budget-row" key={`${budget.year}-${index}`}>
                  <label>Year<input type="number" value={budget.year} onChange={(event) => updateSetupBudget(index, 'year', event.target.value)} /></label>
                  <label>Salary<input type="number" value={budget.salary} onChange={(event) => updateSetupBudget(index, 'salary', event.target.value)} /></label>
                  <label>Needs %<input type="number" value={budget.allocation.needs} onChange={(event) => updateSetupBudget(index, 'needs', event.target.value)} /></label>
                  <label>Wants %<input type="number" value={budget.allocation.wants} onChange={(event) => updateSetupBudget(index, 'wants', event.target.value)} /></label>
                  <label>Savings %<input type="number" value={budget.allocation.savings} onChange={(event) => updateSetupBudget(index, 'savings', event.target.value)} /></label>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-section">
            <h2>Categories</h2>
            <div className="chip-list">
              {setup.categories.map((category) => (
                <span className="chip" key={category.name}>
                  <i style={{ background: category.color }} /> {category.name}
                </span>
              ))}
            </div>
          </section>

          <section className="glass-section">
            <h2>Payment methods</h2>
            <div className="chip-list">
              {setup.paymentMethods.map((method) => <span className="chip" key={method.name}>{method.name}</span>)}
            </div>
          </section>

          <button className="primary-btn setup-submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Finish setup'} <FiArrowRight />
          </button>
          {message && <p className="form-message">{message}</p>}
        </form>
      </main>
    )
  }

  return (
    <main className="app-shell dashboard-shell">
      <TopBar user={activeProfile} onLogout={logout} />
      <section className="dashboard-grid">
        <div className="page-heading">
          <span className="eyebrow">Expense tracker</span>
          <h1>Today’s spending, yearly context.</h1>
        </div>

        <section className="stat-grid">
          <Stat label="Weekly limit" value={money.format(currentBudget?.weeklyLimit || 0)} tone="purple" />
          <Stat label="Total spent" value={money.format(totals.total)} tone="white" />
          <Stat label="Needs" value={money.format(totals.Need)} tone="green" />
          <Stat label="Wants" value={money.format(totals.Want)} tone="red" />
        </section>

        <section className="app-tabs">
          {[
            ['add-expense', 'Add Expense'],
            ['transactions', 'All Transactions'],
            ['weekly', 'Weekly'],
            ['monthly', 'Monthly'],
            ['yearly', 'Yearly'],
            ['custom', 'Custom'],
          ].map(([page, label]) => (
            <button
              className={appPage === page ? 'active' : ''}
              key={page}
              onClick={() => setAppPage(page)}
              type="button"
            >
              {label}
            </button>
          ))}
        </section>

        {appPage === 'weekly' && (
          <WeeklyAnalysis
            analysis={weeklyAnalysis}
            range={weeklyRange}
            setRange={setWeeklyRange}
          />
        )}

        {appPage === 'monthly' && (
          <MonthlyAnalysis
            analysis={monthlyAnalysis}
            month={monthlyMonth}
            setMonth={setMonthlyMonth}
          />
        )}

        {appPage === 'transactions' && (
          <TransactionsPage
            expenses={monthlyTransactions}
            month={transactionMonth}
            onDelete={deleteExpense}
            onEdit={startEditExpense}
            setMonth={setTransactionMonth}
          />
        )}

        {['yearly', 'custom'].includes(appPage) && (
          <section className="glass-section analysis-section">
            <span className="eyebrow">{appPage} analysis</span>
            <h2>{appPage.charAt(0).toUpperCase() + appPage.slice(1)} view is next.</h2>
          </section>
        )}

        {appPage === 'add-expense' && (
        <form className="glass-section expense-form" onSubmit={submitExpense}>
          <div className="section-title expense-form-title">
            <h2>{editingExpenseId ? 'Edit expense' : 'Add expense'}</h2>
            {editingExpenseId && (
              <button className="icon-btn quiet-btn" type="button" onClick={cancelEditExpense} title="Cancel edit">
                <FiX />
              </button>
            )}
          </div>
          <label>Date<input type="date" value={expenseForm.date} onChange={(event) => setExpenseForm({ ...expenseForm, date: event.target.value })} /></label>
          <label>Description<input value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} /></label>
          <label>Category<select value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}>{activeProfile.categories?.map((category) => <option key={category._id || category.name}>{category.name}</option>)}</select></label>
          <label>Amount<input type="number" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} /></label>
          <label>Payment Mode<select value={expenseForm.paymentMode} onChange={(event) => setExpenseForm({ ...expenseForm, paymentMode: event.target.value })}>{activeProfile.paymentMethods?.map((method) => <option key={method._id || method.name}>{method.name}</option>)}</select></label>
          <label>Type<select value={expenseForm.type} onChange={(event) => setExpenseForm({ ...expenseForm, type: event.target.value })}><option>Need</option><option>Want</option><option>Saving</option></select></label>
          <label className="wide-input">Notes<textarea value={expenseForm.notes} onChange={(event) => setExpenseForm({ ...expenseForm, notes: event.target.value })} /></label>
          <button className="primary-btn" disabled={submitting}>
            {submitting ? 'Saving...' : editingExpenseId ? 'Update expense' : 'Add expense'}
            {editingExpenseId ? <FiCheck /> : <FiPlus />}
          </button>
          {message && <p className="form-message">{message}</p>}
        </form>
        )}

        {false && (
        <section className="glass-section expense-list">
          <h2>Recent expenses</h2>
          {expenses.length === 0 ? (
            <p className="muted">No expenses yet.</p>
          ) : (
            expenses.map((expense) => (
              <article className="expense-item" key={expense._id}>
                <div>
                  <strong>{expense.description}</strong>
                  <span>{expense.category} · {expense.paymentMode}</span>
                </div>
                <div className="amount-stack">
                  <strong>{money.format(expense.amount)}</strong>
                  <span className={`type-pill ${expense.type.toLowerCase()}`}>{expense.type}</span>
                </div>
                <div className="expense-actions">
                  <button className="icon-btn quiet-btn" type="button" onClick={() => startEditExpense(expense)} title="Edit expense">
                    <FiEdit2 />
                  </button>
                  <button className="icon-btn danger-btn" type="button" onClick={() => deleteExpense(expense._id)} title="Delete expense">
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
        )}
      </section>
    </main>
  )
}

function TransactionsPage({ expenses, month, onDelete, onEdit, setMonth }) {
  const monthlyTotal = expenses.reduce((total, expense) => total + expense.amount, 0)

  return (
    <section className="glass-section transaction-page">
      <div className="analysis-header">
        <div>
          <span className="eyebrow">All transactions</span>
          <h2>Transactions for selected month</h2>
        </div>
        <label className="month-filter">
          Month
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </div>

      <div className="analysis-summary-grid">
        <Stat label="Transactions" value={String(expenses.length)} tone="white" />
        <Stat label="Monthly spend" value={money.format(monthlyTotal)} tone="purple" />
      </div>

      <div className="transaction-list">
        {expenses.length === 0 ? (
          <p className="muted">No transactions for this month.</p>
        ) : (
          expenses.map((expense) => (
            <article className="expense-item" key={expense._id}>
              <div>
                <strong>{expense.description}</strong>
                <span>{new Date(expense.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })} - {expense.category} - {expense.paymentMode}</span>
              </div>
              <div className="amount-stack">
                <strong>{money.format(expense.amount)}</strong>
                <span className={`type-pill ${expense.type.toLowerCase()}`}>{expense.type}</span>
              </div>
              <div className="expense-actions">
                <button className="icon-btn quiet-btn" type="button" onClick={() => onEdit(expense)} title="Edit expense">
                  <FiEdit2 />
                </button>
                <button className="icon-btn danger-btn" type="button" onClick={() => onDelete(expense._id)} title="Delete expense">
                  <FiTrash2 />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function MonthlyAnalysis({ analysis, month, setMonth }) {
  return (
    <section className="glass-section monthly-sheet">
      <div className="monthly-controls">
        <label>
          Month
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <div className="score-card">
          <span>Score</span>
          <strong>{analysis.score}</strong>
        </div>
      </div>

      <div className="monthly-grid">
        <div className="monthly-table-wrap">
          <table className="analysis-table monthly-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Spent</th>
              </tr>
            </thead>
            <tbody>
              {analysis.days.map((day) => (
                <tr key={day.key} className={day.spent === 0 ? 'empty-day-row' : ''}>
                  <td>{formatDayLabel(day.date)}</td>
                  <td>{money.format(day.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pie-panel">
          <div>
            <span className="eyebrow">{analysis.monthName} {analysis.year}</span>
            <h2>Actual Spend</h2>
          </div>
          {analysis.total === 0 ? (
            <p className="muted">No spend in this month yet.</p>
          ) : (
            <div className="pie-layout">
              <PieChart rows={analysis.categoryRows} />
              <div className="pie-legend">
                {analysis.categoryRows.map((row) => (
                  <div className="legend-row" key={row.category}>
                    <i style={{ background: row.color }} />
                    <span>{row.category}</span>
                    <strong>{formatPercent(row.percent)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PieChart({ rows }) {
  let offset = 0
  const gradient = rows.map((row) => {
    const start = offset
    offset += row.percent
    return `${row.color} ${start}% ${offset}%`
  }).join(', ')

  return (
    <div className="pie-chart" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="pie-hole">
        <span>Total</span>
        <strong>{money.format(rows.reduce((sum, row) => sum + row.actual, 0))}</strong>
      </div>
    </div>
  )
}

function WeeklyAnalysis({ analysis, range, setRange }) {
  return (
    <section className="glass-section analysis-section">
      <div className="analysis-header">
        <div>
          <span className="eyebrow">Weekly analysis</span>
          <h2>Selected date range</h2>
        </div>
        <div className="date-range-controls">
          <label>Start<input type="date" value={range.startDate} onChange={(event) => setRange((state) => ({ ...state, startDate: event.target.value }))} /></label>
          <label>End<input type="date" value={range.endDate} onChange={(event) => setRange((state) => ({ ...state, endDate: event.target.value }))} /></label>
        </div>
      </div>

      <div className="analysis-summary-grid">
        <Stat label="Total" value={money.format(analysis.totalActual)} tone="white" />
        <Stat label="Weekly limit" value={money.format(analysis.weeklyLimit)} tone="purple" />
        <Stat label="Amount left" value={money.format(analysis.amountLeft)} tone={analysis.amountLeft >= 0 ? 'green' : 'red'} />
        <Stat label="Percentage left" value={formatPercent(analysis.percentageLeft)} tone={analysis.percentageLeft >= 0 ? 'green' : 'red'} />
      </div>

      <div className="analysis-tables">
        <div className="analysis-table-wrap">
          <h3>Category spend</h3>
          <table className="analysis-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Actual Spend</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {analysis.categoryRows.length === 0 ? (
                <tr><td colSpan="3">No transactions in this range.</td></tr>
              ) : (
                analysis.categoryRows.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{money.format(row.actual)}</td>
                    <td><span className={`type-pill ${row.type.toLowerCase()}`}>{row.type}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="analysis-table-wrap">
          <h3>Budget vs actual</h3>
          <table className="analysis-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Actual</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {analysis.typeRows.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{money.format(row.budget)}</td>
                  <td>{money.format(row.actual)}</td>
                  <td className={row.difference >= 0 ? 'positive-cell' : 'negative-cell'}>
                    {money.format(row.difference)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function TopBar({ user, onLogout }) {
  return (
    <header className="top-bar">
      <div className="brand-row">
        <div className="brand-mark"><FiShield /></div>
        <span>Velrix</span>
      </div>
      <div className="top-actions">
        <span>{user?.name}</span>
        <button className="icon-btn" type="button" onClick={onLogout} title="Logout"><FiLogOut /></button>
      </div>
    </header>
  )
}

function Stat({ label, value, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default App
