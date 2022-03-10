var Greeter = artifacts.require("Greeter")

module.exports = deployer => {
	deployer.deploy(Greeter, "Hello, World")
}
