/**
 * Centralized coin tracking with ledger
 */
function addCoins(amount, source) {
  const coins = wx.getStorageSync('awakeningCoins') || 0
  wx.setStorageSync('awakeningCoins', coins + amount)

  const ledger = wx.getStorageSync('coinLedger') || []
  ledger.unshift({
    amount,
    source,
    balance: coins + amount,
    time: new Date().toISOString()
  })
  // Keep last 500 entries
  wx.setStorageSync('coinLedger', ledger.slice(0, 500))
  return coins + amount
}

function getLedger() {
  return wx.getStorageSync('coinLedger') || []
}

module.exports = { addCoins, getLedger }
