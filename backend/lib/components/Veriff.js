const axios = require("axios");
const crypto = require("crypto");
const { config } = require("../../config");

const {
  veriff: { baseUrl: BASE_URL, publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY },
} = config;

const generateXSignature = async (payload) => {
  const signature = crypto.createHash("sha256");
  signature.update(new Buffer.from(payload, "utf8"));
  signature.update(new Buffer.from(PRIVATE_KEY, "utf8"));
  return signature.digest("hex");
};

const createSessionUrl = async (user) => {
  const body = {
    verification: {
      callback: `https://fightpandemics.com/${
        user.ownerId ? "organisation" : "profile"
      }/${user._id}`,
      person: {
        firstName: user.name || user.firstName,
        lastName: user.lastName,
      },
      vendorData: user._id,
      lang: "en",
      timestamp: new Date(),
    },
  };

  try {
    const res = await axios({
      url: "/v1/sessions/",
      method: "POST",
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": PUBLIC_KEY,
      },
      data: body,
    });

    if (res.data.status === "success") return res.data.verification.url;
    return null;
  } catch (err) {
    return null;
  }
};

const validateWebhookEvent = async (req, reply) => {
  const incomingXAuthClient = req.headers["x-auth-client"];
  // reject if "x-auth-client" is not equal to PUBLIC_KEY
  if (PUBLIC_KEY !== incomingXAuthClient) {
    req.log.error(`staging debug: 403 details 1 - ${PUBLIC_KEY}, ${incomingXAuthClient}`);
    throw false;
  }
  req.log.error(`staging debug: working 1 - ${PUBLIC_KEY}, ${incomingXAuthClient}`);

  // use rawBody + PRIVATE_KEY to build the xSignature
  // and compare it to "x-signature" header.
  const rawBody = JSON.stringify(req.body);
  const incomingXSignature = req.headers["x-signature"];
  const xSignature = await generateXSignature(rawBody);

  if (xSignature != incomingXSignature) {
    req.log.error(`staging debug: 403 details 2 - ${xSignature}, ${incomingXSignature}`);
    throw false;
  }
  req.log.error(`staging debug: working 2 - ${xSignature}, ${incomingXSignature}`);
};

module.exports = {
  createSessionUrl,
  validateWebhookEvent,
};
