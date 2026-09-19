const c = require("../services/crud")("case");
module.exports = {
  getEmergencyCases: c.list,
  getEmergencyCaseById: c.get,
  createEmergencyCase: c.create,
  updateEmergencyCase: c.update,
  deleteEmergencyCase: c.remove,
};
