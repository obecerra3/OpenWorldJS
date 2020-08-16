define([], () =>
{
    var EventQ =
    {
        q : [],

        // Expects event_obj with parameters
        // verify : () => {},
        // action : () => {},
        // arguments : []
        push : (event_obj) =>
        {
            EventQ.q.push(event_obj);
        },

        update : () =>
        {
            if (EventQ.q.length > 0)
            {
                var shift_count = 0;
                EventQ.q.forEach((event_obj) =>
                {
                    if (event_obj.verify())
                    {
                        event_obj.action.apply(this, event_obj.arguments);
                        shift_count++;
                    }
                });

                for (i = 0; i < shift_count; i++)
                {
                    EventQ.q.shift();
                }
            }
        },
    };

    return EventQ;
})
