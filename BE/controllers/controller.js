export const usernameController = (req, res) => {
    const username = req.params.username;
    res.send(`This is ${username}'s webpage`)
}

export const searchController = (req, res) => {
    const key = req.query.key;
    res.send(`This is result of ${key}`)
}
