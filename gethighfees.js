var request = require('sync-request');ltoltoltoltoltolto
var fs = require('fs');

/**
 * Script for finding transactions with a high lto fee   
 * Put your settings here:
 *     - startBlockHeight: the block from which you want to start distribution for
 *     - endBlock: the block until you want to distribute the earnings  
 *     - node: address of your node in the form http://<ip>:<port
 */
var config = {
    startBlockHeight: 0,
    endBlock: 0,
    node: 'http://localhost:6869'
};

var currentStartBlock = config.startBlockHeight;
var HighFees = [];

/**
  * This method starts the overall process by first downloading the blocks,
  * preparing the necessary datastructures and finally preparing the payments
  * and serializing them into a file that could be used as input for the
  * masspayment tool.
 */
var start = function() {
    console.log('getting blocks...');
    var blocks = getAllBlocks();
    console.log('preparing datastructures...');
    prepareDataStructure(blocks);


    HighFees.forEach(function(tx) {
    		tx.feeAsset = "lto";
				console.log("Block: " + tx.block + " Fee: " + (tx.fee/ Math.pow(10, 8)) + " asset: " + tx.feeAsset + " Generator: " + tx.generator + " Sender: " + tx.sender);		
		});                        

};

/**
 * This method organizes the datastructures that are later on necessary
 * for the block-exact analysis of the leases.
 *
 *   @param blocks all blocks that should be considered
 */
 
var prepareDataStructure = function(blocks) {
    blocks.forEach(function(block) {
        block.transactions.forEach(function(transaction) {

            // considering lto fees
            if (!transaction.feeAsset || transaction.feeAsset === '' || transaction.feeAsset === null) {

            		if(transaction.fee > 200000000) // if tx lto fee is more dan 2 lto, filter it. probably a mistake by someone
            		{
									console.log("Filter TX at block: " + block.height + " Amount: " +  transaction.fee);
									transaction.generator = block.generator;
									transaction.block = block.height;
									HighFees.push(transaction);
								}
            } 
        });
    });
};

/**
 * Method that returns all relevant blocks.
 *
 * @returns {Array} all relevant blocks
 */
var getAllBlocks = function() {

    var blocks = [];

    while (currentStartBlock < config.endBlock) {
        var currentBlocks;

        if (currentStartBlock + 99 < config.endBlock) {
            console.log('getting blocks from ' + currentStartBlock + ' to ' + (currentStartBlock + 99));
            currentBlocks = JSON.parse(request('GET', config.node + '/blocks/seq/' + currentStartBlock + '/' + (currentStartBlock + 99), {
                'headers': {
                    'Connection': 'keep-alive'
                }
            }).getBody('utf8'));
        } else {
            console.log('getting blocks from ' + currentStartBlock + ' to ' + config.endBlock);
            currentBlocks = JSON.parse(request('GET', config.node + '/blocks/seq/' + currentStartBlock + '/' + config.endBlock, {
                'headers': {
                    'Connection': 'keep-alive'
                }
            }).getBody('utf8'));
        }
        currentBlocks.forEach(function(block) {
            if (block.height <= config.endBlock) {
                blocks.push(block);
            }
        });

        if (currentStartBlock + 100 < config.endBlock) {
            currentStartBlock += 100;
        } else {
            currentStartBlock = config.endBlock;
        }
    }

    return blocks;
};


start();

