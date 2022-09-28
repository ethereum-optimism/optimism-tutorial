const Greeter = artifacts.require("Greeter")

contract('Greeter', accounts => {
  it("Should work", async () => {
    greeter = await Greeter.at("0x6D86Ae3e08960f04932Ec8e38C5Ac692351114Ba")
    console.log(await greeter.greet())
  }); // it ... );
});  // contact ...
