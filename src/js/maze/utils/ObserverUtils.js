/*
This implements pool of list nodes data structure:
https://gameprogrammingpatterns.com/observer.html
*/
define(["utils"], (Utils) => {

    var Observer = function (name, onNotify)
    {
        this.name = name;
        this.subjects = {};
        this.onNotify = onNotify;
    }

    Observer.prototype.clearSubjects = () => {
        var subjects = this.subjects;
        for (var entry in subjects) {
            delete subjects[entry];
        }
        this.subjects = {};
    }

    var Subject = function (name)
    {
        this.name = name;
        this.head = new Node(null); // serves as placeholder
        this.numObservers = 0;
    }

    Subject.prototype.addObserver = (observer) =>
    {
        var head = this.head;
        var node = new Node(observer);
        if (head.nextNode === null) {
            head.nextNode = node;
        } else {
            node.nextNode = head.nextNode;
            head.nextNode = node;
        }
        observer.subjects[this.name] = this;
        this.numObservers++;
        return true;
    }

    Subject.prototype.removeObserver = (observer) => {
        var head = this.head;
        var prevNode = head;
        var currNode = head.nextNode;
        while (currNode !== null) {
            if (Utils.isEqual(currNode.observer, observer)) {
                prevNode.nextNode = currNode.nextNode;
                currNode.nextNode = null;
                currNode.observer = null;
                delete observer.subjects[this.name];
                this.numObservers--;
                return true;
            } else {
                prevNode = currNode;
                currNode = currNode.nextNode;
            }
        }
        return false; // observer didn't exist in list
    }

    Subject.prototype.clearObservers = () => {
        var currNode = this.head.nextNode;
        while (currNode !== null) {
            currNode.observer = null;
            currNode = currNode.nextNode;
        }
        this.head.nextNode = null;
        this.numObservers = 0;
    }

    var Node = function (observer)
    {
        this.observer = observer;
        this.nextNode = null;
    }
});
