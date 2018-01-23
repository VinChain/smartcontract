const Migrations = artifacts.require("./Migrations.sol")

module.exports = function(deployer) {
    console.log('initial migration');
    deployer.deploy(Migrations)
}
