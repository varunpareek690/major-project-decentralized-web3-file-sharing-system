## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```


forge script script/DeployScript.s.sol:DeployScript --rpc-url sepolia --broadcast
[⠊] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
  SeedToken deployed at: 0x4aCB0C5c144666953B9d71F89Ed513C5A84F1329
  RewardRegistry deployed at: 0x2e88d3cf8b51f42aea548E7e92D24587Cd019aEb
  Minted 1,000,000 SEED tokens to deployer
  Transferred 500,000 SEED tokens to registry
  
=== Deployment Summary ===
  SeedToken: 0x4aCB0C5c144666953B9d71F89Ed513C5A84F1329
  RewardRegistry: 0x2e88d3cf8b51f42aea548E7e92D24587Cd019aEb
  Deployer Balance: 0 SEED
  Registry Balance: 500000 SEED

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 0.001000011 gwei

Estimated total gas used for script: 3430678

Estimated amount required: 0.000003430715737458 ETH

==========================

##### sepolia
✅  [Success] Hash: 0xc89aa266c7c390bd66a5a013fa6a3e190ec5650556985ffd6d3b072d5870920c
Block: 9702027
Paid: 0.000000052179052179 ETH (52179 gas * 0.001000001 gwei)


##### sepolia
✅  [Success] Hash: 0x4861ffb37ca6efd696b8c577a09f13f48bcdbb36ad222adc1791cfdafcca83f4
Contract Address: 0x2e88d3cf8b51f42aea548E7e92D24587Cd019aEb
Block: 9702027
Paid: 0.000001366347366346 ETH (1366346 gas * 0.001000001 gwei)


##### sepolia
✅  [Success] Hash: 0xab4cc5c28f1d0db7a9293ccf96decc844fa4c055b686bf4a3bd2597b2dfe4208
Contract Address: 0x4aCB0C5c144666953B9d71F89Ed513C5A84F1329
Block: 9702027
Paid: 0.000001138223138222 ETH (1138222 gas * 0.001000001 gwei)


##### sepolia
✅  [Success] Hash: 0xd3fe5da36f37617f307992d3cb705cdcf4120713c092eb4db846cd5a734bc431
Block: 9702027
Paid: 0.000000071263071263 ETH (71263 gas * 0.001000001 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.00000262801262801 ETH (2628010 gas * avg 0.001000001 gwei)
                                                                                                                                                   

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /home/varun/foundry/seed-reward-system/broadcast/DeployScript.s.sol/11155111/run-latest.json

Sensitive values saved to: /home/varun/foundry/seed-reward-system/cache/DeployScript.s.sol/11155111/run-latest.json