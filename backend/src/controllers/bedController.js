const c = require("../services/crud")("bed");
module.exports = {
  getBeds: c.list,
  getBedById: c.get,
  createBed: c.create,
  updateBed: c.update,
  deleteBed: c.remove,
};
