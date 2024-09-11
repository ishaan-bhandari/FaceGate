function validateKnownFace(req, res, next) {
    const { memberId } = req.body;
    if (!memberId) {
        return res.status(400).send({ error: 'memberId is required' });
    }
    next();
}

module.exports = { validateKnownFace };
