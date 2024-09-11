function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const apiKey = process.env.API_KEY;

    if (authHeader && authHeader === apiKey) {
        next();
    } else {
        res.status(401).send({ error: 'Unauthorized' });
    }
}

module.exports = authenticate;
