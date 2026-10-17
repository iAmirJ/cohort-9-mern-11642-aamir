const { expect } = require("chai");
const http = require("http");
const jwt = require("jsonwebtoken");
const ioClient = require("socket.io-client");
const { initSocket, broadcastToUser } = require("../../../src/sockets/socket");

const SECRET = process.env.JWT_ACCESS_SECRET;

function signToken(sub) {
  return jwt.sign({ sub }, SECRET, { expiresIn: "5m" });
}

// IMPORTANT: `io` in src/sockets/socket.js is a module-level singleton that
// only gets set once initSocket() is called. This test MUST run first,
// before any test anywhere in the suite calls initSocket(), or it will no
// longer reflect the "not yet initialised" state.
describe("socket (before initSocket has ever run)", () => {
  it("broadcastToUser is a safe no-op", () => {
    expect(() =>
      broadcastToUser("u1", "note:created", { id: "n1" }),
    ).to.not.throw();
  });
});

describe("socket (after initSocket)", () => {
  let server;
  let url;

  beforeEach((done) => {
    server = http.createServer();
    initSocket(server);
    server.listen(() => {
      url = `http://localhost:${server.address().port}`;
      done();
    });
  });

  afterEach((done) => {
    server.close(() => done());
  });

  it("rejects a connection with no token", (done) => {
    const client = ioClient(url, { reconnection: false });
    client.on("connect_error", (err) => {
      expect(err.message).to.equal("Authentication required");
      client.close();
      done();
    });
    client.on("connect", () => {
      client.close();
      done(new Error("expected connection to be rejected"));
    });
  });

  it("rejects a connection with an invalid/garbage token", (done) => {
    const client = ioClient(url, {
      auth: { token: "garbage.invalid.token" },
      reconnection: false,
    });
    client.on("connect_error", (err) => {
      expect(err.message).to.equal("Invalid or expired token");
      client.close();
      done();
    });
  });

  it("accepts a connection with a valid token via the auth object", (done) => {
    const client = ioClient(url, {
      auth: { token: signToken("u1") },
      reconnection: false,
    });
    client.on("connect", () => {
      expect(client.connected).to.be.true;
      client.close();
      done();
    });
    client.on("connect_error", done);
  });

  it("accepts a connection with a valid token via a query param (Postman-compatible)", (done) => {
    const client = ioClient(url, {
      query: { token: signToken("u1") },
      reconnection: false,
    });
    client.on("connect", () => {
      expect(client.connected).to.be.true;
      client.close();
      done();
    });
    client.on("connect_error", done);
  });

  it("delivers a broadcast only to sockets belonging to that user", (done) => {
    const clientA = ioClient(url, {
      auth: { token: signToken("user-A") },
      reconnection: false,
    });
    const clientB = ioClient(url, {
      auth: { token: signToken("user-B") },
      reconnection: false,
    });

    let aGotIt = false;
    let bGotIt = false;

    clientA.on("note:created", (payload) => {
      aGotIt = true;
      expect(payload).to.deep.equal({ id: "n1", title: "Hi" });
    });
    clientB.on("note:created", () => {
      bGotIt = true;
    });

    let connectedCount = 0;
    const tryBroadcast = () => {
      connectedCount += 1;
      if (connectedCount < 2) return;
      broadcastToUser("user-A", "note:created", { id: "n1", title: "Hi" });
      setTimeout(() => {
        expect(aGotIt).to.be.true;
        expect(bGotIt).to.be.false;
        clientA.close();
        clientB.close();
        done();
      }, 200);
    };

    clientA.on("connect", tryBroadcast);
    clientB.on("connect", tryBroadcast);
  });

  it("a user with two open tabs (two sockets) both receive the same broadcast", (done) => {
    const tabOne = ioClient(url, {
      auth: { token: signToken("u1") },
      reconnection: false,
    });
    const tabTwo = ioClient(url, {
      auth: { token: signToken("u1") },
      reconnection: false,
    });

    let tabOneGotIt = false;
    let tabTwoGotIt = false;

    tabOne.on("note:deleted", () => {
      tabOneGotIt = true;
    });
    tabTwo.on("note:deleted", () => {
      tabTwoGotIt = true;
    });

    let connectedCount = 0;
    const tryBroadcast = () => {
      connectedCount += 1;
      if (connectedCount < 2) return;
      broadcastToUser("u1", "note:deleted", { id: "n1" });
      setTimeout(() => {
        expect(tabOneGotIt).to.be.true;
        expect(tabTwoGotIt).to.be.true;
        tabOne.close();
        tabTwo.close();
        done();
      }, 200);
    };

    tabOne.on("connect", tryBroadcast);
    tabTwo.on("connect", tryBroadcast);
  });
});
