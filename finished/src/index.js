import { encrypt } from 'eth-sig-util'
import MetaMaskOnboarding from '@metamask/onboarding'
import { ethers } from 'ethers'

import WalletArtifact from '../artifacts/contracts/Wallet.sol/Wallet.json'
import { address } from '../walletAddress.json'

const { abi: walletAbi, bytecode: walletBytecode } = WalletArtifact
let walletAddress = address
const currentUrl = new URL(window.location.href)
const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9010'
  : undefined

const isMetaMaskInstalled = () => {
  const { ethereum } = window
  return Boolean(ethereum && ethereum.isMetaMask)
}

// Dapp Status Section
const networkDiv = document.getElementById('network')
const chainIdDiv = document.getElementById('chainId')
const accountsDiv = document.getElementById('accounts')

// Basic Actions Section
const onboardButton = document.getElementById('connectButton')
const getAccountsButton = document.getElementById('getAccounts')
const getAccountsResults = document.getElementById('getAccountsResult')

// Permissions Actions Section
const requestPermissionsButton = document.getElementById('requestPermissions')
const getPermissionsButton = document.getElementById('getPermissions')
const permissionsResult = document.getElementById('permissionsResult')

// Contract Section
const deployButton = document.getElementById('deployButton')
const depositButton = document.getElementById('depositButton')
const withdrawButton = document.getElementById('withdrawButton')
const balanceButton = document.getElementById('balanceButton')
const contractStatus = document.getElementById('contractStatus')
const contractBalance = document.getElementById('contractBalance')
const accBalance = document.getElementById('accBalance')

// Send Eth Section
const sendButton = document.getElementById('sendButton')

// Send Tokens Section
const tokenAddress = document.getElementById('tokenAddress')
const createToken = document.getElementById('createToken')
const transferTokens = document.getElementById('transferTokens')
const approveTokens = document.getElementById('approveTokens')
const transferTokensWithoutGas = document.getElementById('transferTokensWithoutGas')
const approveTokensWithoutGas = document.getElementById('approveTokensWithoutGas')

// Signed Type Data Section
const signTypedData = document.getElementById('signTypedData')
const signTypedDataResults = document.getElementById('signTypedDataResult')

// Encrypt / Decrypt Section
const getEncryptionKeyButton = document.getElementById('getEncryptionKeyButton')
const encryptMessageInput = document.getElementById('encryptMessageInput')
const encryptButton = document.getElementById('encryptButton')
const decryptButton = document.getElementById('decryptButton')
const encryptionKeyDisplay = document.getElementById('encryptionKeyDisplay')
const ciphertextDisplay = document.getElementById('ciphertextDisplay')
const cleartextDisplay = document.getElementById('cleartextDisplay')


const initialize = async () => {

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum)
  let wallet = new ethers.Contract(walletAddress, walletAbi, provider)

  let accounts
  let accountButtonsInitialized = false

  const accountButtons = [
    deployButton,
    depositButton,
    withdrawButton,
    sendButton,
    createToken,
    transferTokens,
    approveTokens,
    transferTokensWithoutGas,
    approveTokensWithoutGas,
    signTypedData,
    getEncryptionKeyButton,
    encryptMessageInput,
    encryptButton,
    decryptButton,
  ]

  deployButton.onclick = async () => {
    const gracePeriodBlocks = 10
    const walletAmount = ethers.utils.parseEther('1.0')

    const signer = provider.getSigner(0)
    const Wallet = new ethers.ContractFactory(walletAbi, walletBytecode, signer)
    wallet = await Wallet.deploy(signer.getAddress(), gracePeriodBlocks, { value: walletAmount })
    await wallet.deployed()
    contractStatus.innerHTML = `Contract successfully deployed to ${wallet.address}`
    walletAddress = wallet.address
    balanceButton.disabled = false
  }

  balanceButton.onclick = async () => {
    const balance = await provider.getBalance(wallet.address)
    contractBalance.innerHTML = `Balance: ${ethers.utils.formatEther(balance)} ETH`
  }

  const isMetaMaskConnected = () => accounts && accounts.length > 0

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress'
    onboardButton.disabled = true
    onboarding.startOnboarding()
  }

  const onClickConnect = async () => {
    try {
      const newAccounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      handleNewAccounts(newAccounts)
    } catch (error) {
      console.error(error)
    }
  }

  const clearTextDisplays = () => {
    encryptionKeyDisplay.innerText = ''
    encryptMessageInput.value = ''
    ciphertextDisplay.innerText = ''
    cleartextDisplay.innerText = ''
  }

  const updateButtons = () => {
    const accountButtonsDisabled = !isMetaMaskInstalled() || !isMetaMaskConnected()
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true
      }
      clearTextDisplays()
    } else {
      deployButton.disabled = false
      sendButton.disabled = false
      createToken.disabled = false
      signTypedData.disabled = false
      getEncryptionKeyButton.disabled = false
    }

    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = 'Click here to install MetaMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
    } else if (isMetaMaskConnected()) {
      onboardButton.innerText = 'Connected'
      onboardButton.disabled = true
      if (onboarding) {
        onboarding.stopOnboarding()
      }
    } else {
      onboardButton.innerText = 'Connect'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
    }

    if (wallet) {
      balanceButton.disabled = false
    }
  }

  const initializeAccountButtons = () => {

    if (accountButtonsInitialized) {
      return
    }
    accountButtonsInitialized = true

    /**
     * Contract Interactions
     */

    /**
     * Sending ETH
     */

    sendButton.onclick = () => {
      web3.eth.sendTransaction({
        from: accounts[0],
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        value: '0x29a2241af62c0000',
        gas: 21000,
        gasPrice: 20000000000,
      }, (result) => {
        console.log(result)
      })
    }

    /**
     * ERC20 Token
     */

    createToken.onclick = () => {
      const _initialAmount = 100
      const _tokenName = 'TST'
      const _decimalUnits = 0
      const _tokenSymbol = 'TST'
      const humanstandardtokenContract = web3.eth.contract([{
        'constant': true,
        'inputs': [],
        'name': 'name',
        'outputs': [{ 'name': '', 'type': 'string' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'constant': false,
        'inputs': [{ 'name': '_spender', 'type': 'address' }, { 'name': '_value', 'type': 'uint256' }],
        'name': 'approve',
        'outputs': [{ 'name': 'success', 'type': 'bool' }],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      }, {
        'constant': true,
        'inputs': [],
        'name': 'totalSupply',
        'outputs': [{ 'name': '', 'type': 'uint256' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'constant': false,
        'inputs': [{ 'name': '_from', 'type': 'address' }, { 'name': '_to', 'type': 'address' }, {
          'name': '_value',
          'type': 'uint256',
        }],
        'name': 'transferFrom',
        'outputs': [{ 'name': 'success', 'type': 'bool' }],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      }, {
        'constant': true,
        'inputs': [],
        'name': 'decimals',
        'outputs': [{ 'name': '', 'type': 'uint8' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'constant': true,
        'inputs': [],
        'name': 'version',
        'outputs': [{ 'name': '', 'type': 'string' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'constant': true,
        'inputs': [{ 'name': '_owner', 'type': 'address' }],
        'name': 'balanceOf',
        'outputs': [{ 'name': 'balance', 'type': 'uint256' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'constant': true,
        'inputs': [],
        'name': 'symbol',
        'outputs': [{ 'name': '', 'type': 'string' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'constant': false,
        'inputs': [{ 'name': '_to', 'type': 'address' }, { 'name': '_value', 'type': 'uint256' }],
        'name': 'transfer',
        'outputs': [{ 'name': 'success', 'type': 'bool' }],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      }, {
        'constant': false,
        'inputs': [{ 'name': '_spender', 'type': 'address' }, {
          'name': '_value',
          'type': 'uint256',
        }, { 'name': '_extraData', 'type': 'bytes' }],
        'name': 'approveAndCall',
        'outputs': [{ 'name': 'success', 'type': 'bool' }],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      }, {
        'constant': true,
        'inputs': [{ 'name': '_owner', 'type': 'address' }, { 'name': '_spender', 'type': 'address' }],
        'name': 'allowance',
        'outputs': [{ 'name': 'remaining', 'type': 'uint256' }],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      }, {
        'inputs': [{ 'name': '_initialAmount', 'type': 'uint256' }, {
          'name': '_tokenName',
          'type': 'string',
        }, { 'name': '_decimalUnits', 'type': 'uint8' }, { 'name': '_tokenSymbol', 'type': 'string' }],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'constructor',
      }, { 'payable': false, 'stateMutability': 'nonpayable', 'type': 'fallback' }, {
        'anonymous': false,
        'inputs': [{ 'indexed': true, 'name': '_from', 'type': 'address' }, {
          'indexed': true,
          'name': '_to',
          'type': 'address',
        }, { 'indexed': false, 'name': '_value', 'type': 'uint256' }],
        'name': 'Transfer',
        'type': 'event',
      }, {
        'anonymous': false,
        'inputs': [{ 'indexed': true, 'name': '_owner', 'type': 'address' }, {
          'indexed': true,
          'name': '_spender',
          'type': 'address',
        }, { 'indexed': false, 'name': '_value', 'type': 'uint256' }],
        'name': 'Approval',
        'type': 'event',
      }])

      return humanstandardtokenContract.new(
        _initialAmount,
        _tokenName,
        _decimalUnits,
        _tokenSymbol,
        {
          from: accounts[0],
          data: '0x60806040523480156200001157600080fd5b506040516200156638038062001566833981018060405260808110156200003757600080fd5b8101908080516401000000008111156200005057600080fd5b828101905060208101848111156200006757600080fd5b81518560018202830111640100000000821117156200008557600080fd5b50509291906020018051640100000000811115620000a257600080fd5b82810190506020810184811115620000b957600080fd5b8151856001820283011164010000000082111715620000d757600080fd5b5050929190602001805190602001909291908051906020019092919050505083838382600390805190602001906200011192919062000305565b5081600490805190602001906200012a92919062000305565b5080600560006101000a81548160ff021916908360ff1602179055505050506200016433826200016e640100000000026401000000009004565b50505050620003b4565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614151515620001ab57600080fd5b620001d081600254620002e36401000000000262001155179091906401000000009004565b60028190555062000237816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054620002e36401000000000262001155179091906401000000009004565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b6000808284019050838110151515620002fb57600080fd5b8091505092915050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200034857805160ff191683800117855562000379565b8280016001018555821562000379579182015b82811115620003785782518255916020019190600101906200035b565b5b5090506200038891906200038c565b5090565b620003b191905b80821115620003ad57600081600090555060010162000393565b5090565b90565b6111a280620003c46000396000f3fe6080604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100b4578063095ea7b31461014457806318160ddd146101b757806323b872dd146101e2578063313ce5671461027557806339509351146102a657806370a082311461031957806395d89b411461037e578063a457c2d71461040e578063a9059cbb14610481578063dd62ed3e146104f4575b600080fd5b3480156100c057600080fd5b506100c9610579565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101095780820151818401526020810190506100ee565b50505050905090810190601f1680156101365780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561015057600080fd5b5061019d6004803603604081101561016757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061061b565b604051808215151515815260200191505060405180910390f35b3480156101c357600080fd5b506101cc610748565b6040518082815260200191505060405180910390f35b3480156101ee57600080fd5b5061025b6004803603606081101561020557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610752565b604051808215151515815260200191505060405180910390f35b34801561028157600080fd5b5061028a61095a565b604051808260ff1660ff16815260200191505060405180910390f35b3480156102b257600080fd5b506102ff600480360360408110156102c957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610971565b604051808215151515815260200191505060405180910390f35b34801561032557600080fd5b506103686004803603602081101561033c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ba8565b6040518082815260200191505060405180910390f35b34801561038a57600080fd5b50610393610bf0565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103d35780820151818401526020810190506103b8565b50505050905090810190601f1680156104005780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561041a57600080fd5b506104676004803603604081101561043157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610c92565b604051808215151515815260200191505060405180910390f35b34801561048d57600080fd5b506104da600480360360408110156104a457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610ec9565b604051808215151515815260200191505060405180910390f35b34801561050057600080fd5b506105636004803603604081101561051757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ee0565b6040518082815260200191505060405180910390f35b606060038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156106115780601f106105e657610100808354040283529160200191610611565b820191906000526020600020905b8154815290600101906020018083116105f457829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415151561065857600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b6000600254905090565b60006107e382600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610f6790919063ffffffff16565b600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555061086e848484610f89565b3373ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925600160008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546040518082815260200191505060405180910390a3600190509392505050565b6000600560009054906101000a900460ff16905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141515156109ae57600080fd5b610a3d82600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461115590919063ffffffff16565b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546040518082815260200191505060405180910390a36001905092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b606060048054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610c885780601f10610c5d57610100808354040283529160200191610c88565b820191906000526020600020905b815481529060010190602001808311610c6b57829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614151515610ccf57600080fd5b610d5e82600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610f6790919063ffffffff16565b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546040518082815260200191505060405180910390a36001905092915050565b6000610ed6338484610f89565b6001905092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b6000828211151515610f7857600080fd5b600082840390508091505092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614151515610fc557600080fd5b611016816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610f6790919063ffffffff16565b6000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506110a9816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461115590919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a3505050565b600080828401905083811015151561116c57600080fd5b809150509291505056fea165627a7a723058205fcdfea06f4d97b442bc9f444b1e92524bc66398eb4f37ed5a99f2093a8842640029000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000186a00000000000000000000000000000000000000000000000000000000000000003545354000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000035453540000000000000000000000000000000000000000000000000000000000',
          gas: '4700000',
          gasPrice: '20000000000',
        }, (error, contract) => {
          if (error) {
            tokenAddress.innerHTML = 'Creation Failed'
            throw error
          } else if (contract.address === undefined) {
            return
          }

          console.log(`Contract mined! address: ${contract.address} transactionHash: ${contract.transactionHash}`)
          tokenAddress.innerHTML = contract.address
          transferTokens.disabled = false
          approveTokens.disabled = false
          transferTokensWithoutGas.disabled = false
          approveTokensWithoutGas.disabled = false

          transferTokens.onclick = (event) => {
            console.log(`event`, event)
            contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '15000', {
              from: accounts[0],
              to: contract.address,
              data: '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98',
              gas: 60000,
              gasPrice: '20000000000',
            }, (result) => {
              console.log('result', result)
            })
          }

          approveTokens.onclick = () => {
            contract.approve('0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4', '70000', {
              from: accounts[0],
              to: contract.address,
              data: '0x095ea7b30000000000000000000000009bc5baF874d2DA8D216aE9f137804184EE5AfEF40000000000000000000000000000000000000000000000000000000000000005',
              gas: 60000,
              gasPrice: '20000000000',
            }, (result) => {
              console.log(result)
            })
          }

          transferTokensWithoutGas.onclick = (event) => {
            console.log(`event`, event)
            contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '15000', {
              from: accounts[0],
              to: contract.address,
              data: '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98',
              gasPrice: '20000000000',
            }, (result) => {
              console.log('result', result)
            })
          }

          approveTokensWithoutGas.onclick = () => {
            contract.approve('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '70000', {
              from: accounts[0],
              to: contract.address,
              data: '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
              gasPrice: '20000000000',
            }, (result) => {
              console.log(result)
            })
          }
        },
      )
    }

    /**
     * Sign Typed Data
     */

    signTypedData.onclick = async () => {
      const networkId = parseInt(networkDiv.innerHTML, 10)
      // const chainId = parseInt(chainIdDiv.innerHTML, 10) || networkId
      const chainId = 31337 || networkId
      // const owner = provider.getSigner('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
      const _accounts = await ethereum.request({
        method: 'eth_accounts',
      })

      const owner = provider.getSigner(_accounts[0])
      const inputAddr = document.getElementById('inputAddr')
      const heir = provider.getSigner(inputAddr.value)

      const typedData = {
        types: {
          InheritanceMessage: [
            { name: 'heirAddress', type: 'address' },
          ],
        },
        primaryType: 'InheritanceMessage',
        domain: {
          name: 'InheritanceMessage',
          version: '1',
          chainId,
          verifyingContract: walletAddress,
        },
        message: {
          heirAddress: heir._address,
        },
      }

      try {
        // const signature = await ethereum.request({
        //   method: 'eth_signTypedData_v4',
        //   params: [accounts[0], JSON.stringify(typedData)],
        // })
        // console.log(`result`, signature)


        const result2 = await owner._signTypedData(typedData.domain, typedData.types, typedData.message)

        signTypedDataResults.innerHTML = `
          ${JSON.stringify(typedData, null, 2)}
          \n\nSignature\n${JSON.stringify(result2, null, 2)}`

      } catch (err) {
        console.error(err)
      }
    }

    /**
     * Permissions
     */

    requestPermissionsButton.onclick = async () => {
      try {
        const permissionsArray = await ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }

    getPermissionsButton.onclick = async () => {
      try {
        const permissionsArray = await ethereum.request({
          method: 'wallet_getPermissions',
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }

    getAccountsButton.onclick = async () => {
      try {
        const _accounts = await ethereum.request({
          method: 'eth_accounts',
        })
        getAccountsResults.innerHTML = _accounts[0] || 'Not able to get accounts'
      } catch (err) {
        console.error(err)
        getAccountsResults.innerHTML = `Error: ${err.message}`
      }
    }

    /**
     * Encrypt / Decrypt
     */

    getEncryptionKeyButton.onclick = async () => {
      try {
        encryptionKeyDisplay.innerText = await ethereum.request({
          method: 'eth_getEncryptionPublicKey',
          params: [accounts[0]],
        })
        encryptMessageInput.disabled = false
      } catch (error) {
        encryptionKeyDisplay.innerText = `Error: ${error.message}`
        encryptMessageInput.disabled = true
        encryptButton.disabled = true
        decryptButton.disabled = true
      }
    }

    encryptMessageInput.onkeyup = () => {
      if (
        !getEncryptionKeyButton.disabled &&
        encryptMessageInput.value.length > 0
      ) {
        if (encryptButton.disabled) {
          encryptButton.disabled = false
        }
      } else if (!encryptButton.disabled) {
        encryptButton.disabled = true
      }
    }

    encryptButton.onclick = () => {
      try {
        ciphertextDisplay.innerText = web3.toHex(JSON.stringify(
          encrypt(
            encryptionKeyDisplay.innerText,
            { 'data': encryptMessageInput.value },
            'x25519-xsalsa20-poly1305',
          ),
        ))
        decryptButton.disabled = false
      } catch (error) {
        ciphertextDisplay.innerText = `Error: ${error.message}`
        decryptButton.disabled = true
      }
    }

    decryptButton.onclick = async () => {
      try {
        cleartextDisplay.innerText = await ethereum.request({
          method: 'eth_decrypt',
          params: [ciphertextDisplay.innerText, ethereum.selectedAddress],
        })
      } catch (error) {
        cleartextDisplay.innerText = `Error: ${error.message}`
      }
    }
  }

  function handleNewAccounts (newAccounts) {
    accounts = newAccounts
    accountsDiv.innerHTML = accounts
    if (isMetaMaskConnected()) {
      initializeAccountButtons()
    }
    updateButtons()
  }

  function handleNewChain (chainId) {
    chainIdDiv.innerHTML = chainId
  }

  function handleNewNetwork (networkId) {
    networkDiv.innerHTML = networkId
  }

  async function getNetworkAndChainId () {
    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      })
      handleNewChain(chainId)

      const networkId = await ethereum.request({
        method: 'net_version',
      })
      handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  async function getAccResults () {
    try {
      const _accounts = await ethereum.request({
        method: 'eth_accounts',
      })
      getAccountsResults.innerHTML = _accounts[0] || 'Not able to get accounts'
    } catch (err) {
      console.error(err)
      getAccountsResults.innerHTML = `Error: ${err.message}`
    }
  }

  async function getBalance () {
    try {
      const balance = await provider.getBalance(wallet.address)
      accBalance.innerHTML = `Balance: ${ethers.utils.formatEther(balance)} ETH`
    } catch (err) {
      console.error(err)
    }
  }

  updateButtons()
  if (isMetaMaskInstalled()) {

    ethereum.autoRefreshOnNetworkChange = false

    getNetworkAndChainId()
    getAccResults()
    getBalance()

    ethereum.on('chainChanged', handleNewChain)
    ethereum.on('networkChanged', handleNewNetwork)
    ethereum.on('accountsChanged', handleNewAccounts)

    try {
      const newAccounts = await ethereum.request({
        method: 'eth_accounts',
      })
      handleNewAccounts(newAccounts)
    } catch (err) {
      console.error('Error on init when getting accounts', err)
    }
  }
}

window.addEventListener('DOMContentLoaded', initialize)

function getPermissionsDisplayString (permissionsArray) {
  if (permissionsArray.length === 0) {
    return 'No permissions found.'
  }
  const permissionNames = permissionsArray.map((perm) => perm.parentCapability)
  return permissionNames.reduce((acc, name) => `${acc}${name}, `, '').replace(/, $/u, '')
}

