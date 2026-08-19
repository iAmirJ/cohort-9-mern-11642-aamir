const { expect } = require("chai");
const sinon = require("sinon");
const pool = require("../../../src/config/db");
const userRepository = require("../../../src/repositories/user.repository");

describe("user.repository", () => {
  afterEach(() => sinon.restore());

  it("findByEmail returns the row when found", async () => {
    const fakeRow = { id: "1", email: "a@test.com" };
    sinon.stub(pool, "query").resolves({ rows: [fakeRow] });

    const result = await userRepository.findByEmail("a@test.com");
    expect(result).to.deep.equal(fakeRow);
  });

  it("findByEmail returns null when no user matches", async () => {
    sinon.stub(pool, "query").resolves({ rows: [] });
    expect(await userRepository.findByEmail("nobody@test.com")).to.be.null;
  });

  it("createUser never returns password_hash", async () => {
    sinon.stub(pool, "query").resolves({
      rows: [{ id: "1", name: "Aamir", email: "a@test.com" }],
    });

    const result = await userRepository.createUser({
      name: "Aamir",
      email: "a@test.com",
      passwordHash: "hashed",
    });

    expect(result).to.not.have.property("password_hash");
  });

  it("findById returns the row when found", async () => {
    const fakeRow = { id: "u1", name: "Aamir", email: "a@test.com" };
    sinon.stub(pool, "query").resolves({ rows: [fakeRow] });

    const result = await userRepository.findById("u1");
    expect(result).to.deep.equal(fakeRow);
  });

  it("findById returns null when no user matches", async () => {
    sinon.stub(pool, "query").resolves({ rows: [] });
    expect(await userRepository.findById("missing-id")).to.be.null;
  });
});
