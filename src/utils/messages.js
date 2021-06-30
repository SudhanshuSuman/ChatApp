const generateMessage = (username, text) => {
    return {
        sentAt: new Date().getTime(),
        username,
        message: text
    }
}

const generateLocationMessage = (username, coordinates) => {
    return {
        sentAt: new Date().getTime(),
        username,
        url: `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}