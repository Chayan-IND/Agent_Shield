const router = require("express").Router();
const c = require("../controllers/transactionController");

router.get("/stats", c.getStats);
router.get("/", c.getTransactions);
router.post("/", c.createTransaction);

module.exports = router;
