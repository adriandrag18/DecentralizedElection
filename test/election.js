var Election = artifacts.require("./Election.sol")

contract("Election", function(accounts) {
    var electionInstance
    var candidateId

    it("inititializes with 2 candidates", function() {
        return Election.deployed().then(function(instance) {
            return instance.candidatesCount()
        }).then(function(count) {
            assert.equal(count, 2, "candidatesCount")
        })
    })

    it("inititializes with the correct values", function() {
        return Election.deployed().then(function(instance) {
            electionInstance = instance
            return electionInstance.candidates(1)
        }).then(function(candidate) {
            assert.equal(candidate.id, 1, "contains the correct id")
            assert.equal(candidate.name, "Candidate 1", "contains the correct name")
            assert.equal(candidate.voteCount, 0, "contains the correct votes count")
            return electionInstance.candidates(2)
        }).then(function(candidate) {
            assert.equal(candidate.id, 2, "contains the correct id")
            assert.equal(candidate.name, "Candidate 2", "contains the correct name")
            assert.equal(candidate.voteCount, 0, "contains the correct votes count")
        })
    })

    it("allowes voter to cast a vote", function(){
        return Election.deployed().then(function(instance){
            electionInstance = instance
            candidateId = 1
            return electionInstance.vote(candidateId, { from: accounts[0] })
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, "an event must be triggered")
            assert.equal(receipt.logs[0].event, "votedEvent", "The event must be votedEvent")
            assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "candidateId")
            return electionInstance.voters(accounts[0])
        }).then(function(voted) {
            assert(voted, "the voter was marked as voted")
            return electionInstance.candidates(candidateId);
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 1, "candidate should receive 1 vote")
            for (var i = 1; i < 5; i++)
                electionInstance.vote(candidateId, { from: accounts[i]})
            return electionInstance.candidates(candidateId);
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 5, "candidate should receive 5 vote")
        })
    })

    it("invalide candidates", function(){
        return Election.deployed().then(function(instance){
            electionInstance = instance
            return electionInstance.vote(999, {from: accounts[6]})
        }).then(assert.fail).catch(function(err) {
            assert(err.message.indexOf('revert') >= 0, "error message must contain revert: " + err.message)
            return electionInstance.candidates(1)
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 5, "Candidate 1 should have 5 votes")
            return electionInstance.candidates(2)
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 0, "Candidate 2 should have 0 votes")
        })
    })

    it("double voting", function() {
        return Election.deployed().then(function(instance) {
            electionInstance = instance
            candidateId = 2
            electionInstance.vote(candidateId, {from: accounts[0]})
            return electionInstance.candidate(candidateId)
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 1 , "The vote count of the second candidate should be 1")
            return electionInstance.vote(candidateId, {from: accounts[0]})
        }).then(assert.fail).catch(function(err) {
            assert(err.message.indexOf('revert') >= 0, "error message must contain revert: " + err.message)
            return electionInstance.candidates(candidateId)
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 1, "The vote count of the second candidate should be 1")
            return electionInstance.vote(candidateId - 1, {from: accounts[0]})
        }).then(assert.fail).catch(function(err) {
            assert(err.message.indexOf('revert') >= 0, "error message contain must revert: " + err.message)
            return electionInstance.candidates(candidateId - 1)
        }).then(function(candidate) {
            assert.equal(candidate.voteCount, 5, "The vote count of the first candicate should be 5")
        })
    })
})
