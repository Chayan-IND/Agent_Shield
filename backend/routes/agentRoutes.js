const router = require("express").Router();
const c = require("../controllers/agentController");

router.get("/", c.getAgents);
router.post("/", c.createAgent);
router.patch("/:id/limit", c.updateLimit);
router.patch("/:id/toggle", c.toggleAgent);

module.exports = router;
