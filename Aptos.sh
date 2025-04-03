#!/bin/bash

# 初始化项目
aptos move init --name anteros

# 编译项目
aptos move compile

# 运行测试
aptos move test

# 本地测试网
aptos node run-local-testnet --with-faucet

# 初始化本地测试网账户配置
aptos init --profile local --network local

# 初始化测试网账户配置
aptos init --profile testnet --network testnet

# 编译项目
aptos move compile --named-addresses my_addr=testnet

# 发布项目
aptos move publish --named-addresses my_addr=testnet --profile testnet

# 发布测试网项目
aptos move publish --named-addresses my_addr=testnet --profile testnet

# 查看模块
aptos account list --query modules --account 201a8260562b88ac4519c8a128ce3235f8d935437df7bbe729056420e672b07b --profile local

# 查看交易
curl http://localhost:8080/v1/transactions/by_hash/0xd96bccea8d3fd6987d5df7c7debd21549dbd1102fb590337a06b0be9fc308ec3

# 运行测试
aptos move test --filter "trend_trading_tests::test_price_impact_and_funding_rate"