
class Mutex {
    constructor() {
        var self = this; // still unsure about how "this" is captured
        var mtx = new Promise(t => t()); // fulfilled promise ≡ unlocked mutex
        this.lock = async function () {
            await mtx;
            mtx = new Promise(t => {
                self.unlock = () => t();
            });
        };
    }
}
