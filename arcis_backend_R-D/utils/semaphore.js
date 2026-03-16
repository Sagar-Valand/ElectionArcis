class Semaphore {
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
        this.queue = [];
        this.activeCount = 0;
    }

    async acquire() {
        return new Promise((resolve) => {
            const attempt = () => {
                if (this.activeCount < this.maxConcurrent) {
                    this.activeCount++;
                    resolve();
                } else {
                    this.queue.push(attempt);
                }
            };
            attempt();
        });
    }

    release() {
        this.activeCount--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        }
    }
}

const semaphore = new Semaphore(1); // Limit to 1 concurrent process
module.exports = semaphore;