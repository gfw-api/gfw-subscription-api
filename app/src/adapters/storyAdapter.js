const logger = require('logger');
const UrlService = require('services/urlService');

const DOMAIN_IMAGE = 'http://gfw2stories.s3.amazonaws.com/uploads/';

const searchImage = (story) => {
    if (story.media) {
        for (let i = 0, { length } = story.media; i < length; i++) {
            if (story.media[i].previewUrl) {
                return DOMAIN_IMAGE + story.media[i].previewUrl;
            }
        }
    }
    return null;
};

class StoryAdapter {

    constructor(results) {
        this.results = results;
    }

    transform() {
        const stories = [];
        if (this.results && this.results.length > 0) {
            for (let i = 0, { length } = this.results; i < length; i++) {
                stories.push({
                    title: this.results[i].title,
                    description: this.results[i].details ? this.results[i].details.substring(0, 350) : '',
                    url: UrlService.flagshipUrl(`/stories/${this.results[i].id}`),
                    image: searchImage(this.results[i])
                });

            }
        }
        logger.info('Stories', stories);
        return {
            list: this.results,
            value: this.results.length,
            stories
        };
    }

}

module.exports = StoryAdapter;
