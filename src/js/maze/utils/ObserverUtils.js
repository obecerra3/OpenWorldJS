/*
I'm using pool of list nodes data structure:
https://gameprogrammingpatterns.com/observer.html
*/
define(["utils"], (Utils) => {
    var Observer = function (name, onNotify)
    {
        this.name = name;
        this.onNotify = onNotify;
    }

    var Subject = function (name)
    {
        this.name = name;
        this.head = new Node(null); // serves as placeholder
        this.numObservers = 0;
    }

    Subject.prototype.addObserver = (head, observer) =>
    {
        var node = new Node(observer);
        if (head.nextNode === null) {
            head.nextNode = node;
        } else {
            node.nextNode = head.nextNode;
            head.nextNode = node;
        }
        numObservers++;
        return true;
    }

    Subject.prototype.removeObserver = (head, observer) => {
        var prev = head;
        var trav = head.nextNode;
        while (trav != null) {
            if (Utils.isEqual(trav.observer, observer)) {
                prev.nextNode = trav.nextNode;
                trav.nextNode = null;
                trav.observer = null;
                return true;
            } else {
                prev = trav;
                trav = trav.nextNode;
            }
        }
        return false; // observer didn't exist in list
    }

    var Node = function (observer)
    {
        this.observer = observer;
        this.nextNode = null;
    }
});
