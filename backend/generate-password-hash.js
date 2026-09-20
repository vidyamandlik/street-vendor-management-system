const { randomBytes, scrypt } = require("crypto");
const { promisify } = require("util");

const password = process.argv[2];

if (!password) {
    console.error("Usage: node generate-password-hash.js <password>");
    process.exit(1);
}

(async () => {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await promisify(scrypt)(password, salt, 64);
    console.log(`${salt}:${derivedKey.toString("hex")}`);
})();
