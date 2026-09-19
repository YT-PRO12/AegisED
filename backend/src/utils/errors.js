class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const assert = (condition, status, message) => {
  if (!condition) throw new AppError(status, message);
};
module.exports = { AppError, assert };
