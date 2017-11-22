module.exports.increaseTime = function(deltaTime){
    if(deltaTime > 0){
        console.log("TIME INCREASED +" + deltaTime)
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [deltaTime],
            id: new Date().getTime()
          })
    }
}

module.exports.now = () => web3.eth.getBlock(web3.eth.blockNumber).timestamp