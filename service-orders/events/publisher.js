exports.publishEvent = (eventName, data) => {
    //заменить на брокер сообщений
    console.log(JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        data
    }));
}