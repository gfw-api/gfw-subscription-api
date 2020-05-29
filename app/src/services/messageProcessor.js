/* eslint-disable no-param-reassign */
class MessageProcessor {

    static getLayerSlug(message) {
        message = JSON.parse(message);
        return message.layer_slug;
    }

    static getBeginDate(message) {
        message = JSON.parse(message);
        return new Date(Date.parse(message.begin_date));
    }

    static getEndDate(message) {
        message = JSON.parse(message);
        return new Date(Date.parse(message.end_date));
    }

    static getEmail(message) {
        message = JSON.parse(message);
        return message.email ? message.email : null;
    }

}

module.exports = MessageProcessor;
