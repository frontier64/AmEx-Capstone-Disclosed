exports.helloWorld = (req, res) => {
  let message = req.query.message || req.body.message || 'This is a message.';
  res.status(200).send(message);
};
