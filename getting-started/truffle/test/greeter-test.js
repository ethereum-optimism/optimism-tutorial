const Greeter = artifacts.require("Greeter")

contract('Greeter', accounts => {
  it("Should return the new greeting once it's changed", async function () {
    const greeter = await Greeter.new("Hello, world!");

    console.log(`Addr: ${greeter.address}`)

    expect(await greeter.greet()).to.equal("Hello, world!");

    await greeter.setGreeting("Hola, mundo!");

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });   // it ...    
});  // contact ...
