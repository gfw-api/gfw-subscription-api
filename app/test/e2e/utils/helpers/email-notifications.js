const assertSubscriptionStats = (jsonMessage, sub) => {
    jsonMessage.should.have.property('sender').and.equal('gfw');
    jsonMessage.should.have.property('data').and.be.a('object');
    jsonMessage.data.should.have.property('counter').and.equal(1);
    jsonMessage.data.should.have.property('dataset').and.equal('viirs-active-fires');
    jsonMessage.data.should.have.property('users').and.be.an('array').and.length(1);
    jsonMessage.data.users[0].should.have.property('userId').and.equal(sub.userId);
    jsonMessage.data.users[0].should.have.property('subscriptionId').and.equal(sub.id);
    jsonMessage.data.users[0].should.have.property('email').and.equal(sub.resource.content);
    jsonMessage.should.have.property('recipients').and.be.a('array').and.length(1);
    jsonMessage.recipients[0].should.be.an('object').and.have.property('address')
        .and.have.property('email').and.equal('info@vizzuality.com');
};

module.exports = {
    assertSubscriptionStats,
};
