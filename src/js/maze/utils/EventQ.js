define([], () =>
{
    var EventQ =
    {
        q : [],

        push : (event_obj) =>
        {
            EventQ.q.push(event_obj);
        },

        update : () =>
        {
            if (EventQ.q.length > 0)
            {
                EventQ.q.forEach((event_obj) =>
                {
                    if (event_obj.verify())
                    {
                        event_obj.action.apply(this, event_obj.arguments);
                        EventQ.q.shift();
                    }
                });
            }
        },
    };

    return EventQ;
})
