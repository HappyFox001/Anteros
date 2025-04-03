// test.js
import { AptosClient, FaucetClient, AptosAccount, TxnBuilderTypes, BCS } from "aptos";

async function main() {
  try {
    console.log("开始测试 Aptos 本地测试网络...");
    
    // 连接到本地节点
    const NODE_URL = "http://127.0.0.1:8080";
    const FAUCET_URL = "http://127.0.0.1:8081";
    
    console.log(`连接到节点: ${NODE_URL}`);
    console.log(`连接到水龙头: ${FAUCET_URL}`);
    
    const client = new AptosClient(NODE_URL);
    const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
    
    // 检查节点连接
    try {
      const ledgerInfo = await client.getLedgerInfo();
      console.log("成功连接到节点!");
      console.log(`链 ID: ${ledgerInfo.chain_id}`);
      console.log(`当前区块高度: ${ledgerInfo.block_height}`);
      console.log(`当前版本: ${ledgerInfo.ledger_version}`);
    } catch (error) {
      console.error("无法连接到节点:", error.message);
      return;
    }
    
    // 创建两个测试账户
    console.log("\n创建测试账户...");
    const account1 = new AptosAccount();
    const account2 = new AptosAccount();
    
    console.log(`账户1地址: ${account1.address().hex()}`);
    console.log(`账户2地址: ${account2.address().hex()}`);
    
    // 为两个账户获取资金
    console.log("\n为账户1请求测试代币...");
    try {
      const txnHashes = await faucetClient.fundAccount(account1.address(), 100_000_000);
      console.log("账户1已获得资金，交易哈希:", txnHashes);
      
      // 等待交易确认
      for (const hash of txnHashes) {
        await client.waitForTransaction(hash);
      }
      console.log("账户1水龙头交易已确认");
      
      // 为账户2也请求少量资金，以初始化账户
      console.log("\n为账户2请求测试代币以初始化账户...");
      const txnHashes2 = await faucetClient.fundAccount(account2.address(), 10_000_000);
      console.log("账户2已获得资金，交易哈希:", txnHashes2);
      
      // 等待交易确认
      for (const hash of txnHashes2) {
        await client.waitForTransaction(hash);
      }
      console.log("账户2水龙头交易已确认");
    } catch (error) {
      console.error("水龙头请求失败:", error.message);
      console.error("详细错误:", error);
      return;
    }
    
    // 查询两个账户的初始余额
    console.log("\n查询初始余额...");
    try {
      // 账户1余额
      const resources1 = await client.getAccountResources(account1.address());
      const aptosCoin1 = resources1.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      
      if (aptosCoin1) {
        const balance1 = aptosCoin1.data.coin.value;
        console.log(`账户1初始余额: ${balance1} octa (${balance1 / 100_000_000} APT)`);
      }
      
      // 账户2余额
      const resources2 = await client.getAccountResources(account2.address());
      const aptosCoin2 = resources2.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      
      if (aptosCoin2) {
        const balance2 = aptosCoin2.data.coin.value;
        console.log(`账户2初始余额: ${balance2} octa (${balance2 / 100_000_000} APT)`);
      } else {
        console.log("账户2没有 APT 代币");
      }
    } catch (error) {
      console.error("查询余额失败:", error.message);
      return;
    }
    
    // 执行从账户1到账户2的转账
    console.log("\n执行转账交易 (账户1 -> 账户2)...");
    const transferAmount = 20_000_000; // 0.2 APT
    
    try {
      // 使用更明确的方式构建交易
      const entryFunctionPayload = {
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [account2.address().hex(), transferAmount.toString()]
      };
      
      console.log(`准备转账 ${transferAmount / 100_000_000} APT 到账户2`);
      
      // 生成交易
      const rawTxn = await client.generateTransaction(
        account1.address(), 
        entryFunctionPayload
      );
      
      // 签名交易
      const signedTxn = await client.signTransaction(account1, rawTxn);
      
      // 提交交易
      const transactionRes = await client.submitTransaction(signedTxn);
      console.log(`交易已提交，哈希: ${transactionRes.hash}`);
      
      // 等待交易确认并处理可能的错误
      console.log("等待交易确认...");
      try {
        const txnInfo = await client.waitForTransactionWithResult(transactionRes.hash);
        
        if (txnInfo && txnInfo.success) {
          console.log(`交易已确认，状态: 成功`);
          console.log(`Gas 使用量: ${txnInfo.gas_used}`);
          console.log(`区块高度: ${txnInfo.version}`);
        } else if (txnInfo) {
          console.log(`交易已确认，状态: 失败`);
          console.log(`错误信息: ${JSON.stringify(txnInfo.vm_status)}`);
        } else {
          console.log("交易确认返回未知状态");
        }
      } catch (waitError) {
        console.error("等待交易确认时出错:", waitError.message);
      }
    } catch (error) {
      console.error("转账失败:", error.message);
      return;
    }
    
    // 查询转账后的余额
    console.log("\n查询转账后的余额...");
    
    try {
      // 账户1余额
      const resources1 = await client.getAccountResources(account1.address());
      const aptosCoin1 = resources1.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      
      if (aptosCoin1) {
        const balance1 = aptosCoin1.data.coin.value;
        console.log(`账户1最终余额: ${balance1} octa (${balance1 / 100_000_000} APT)`);
      }
      
      // 账户2余额
      const resources2 = await client.getAccountResources(account2.address());
      const aptosCoin2 = resources2.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      
      if (aptosCoin2) {
        const balance2 = aptosCoin2.data.coin.value;
        console.log(`账户2最终余额: ${balance2} octa (${balance2 / 100_000_000} APT)`);
      } else {
        console.log("账户2没有 APT 代币");
      }
    } catch (error) {
      console.error("查询余额失败:", error.message);
    }
    
    console.log("\n测试完成!");
  } catch (error) {
    console.error("测试过程中发生错误:", error);
  }
}

main();
