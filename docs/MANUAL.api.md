Web API Documentation
=====================

The API is a REST API. It returns JSON objects.

Common arguments
----------------

### Queue ID

When a URL has `:id` in it, it should be replaced by the queue's ID.

### Pagination

For verbs that return lists of elements, pagination arguments can be passed in the
URL:
* `limit`: number of results to retun.
* `start`: index of the first result to return.
* `page`: used if `start` is not provided. Page counting starts at 1.

Example:

    web-api-server:3000/queues?start=3&limit=3

### Modification result

When a modification is requested, the following object is returned:

    {
        "success":  ["false"|"true"],
        "error":    error_object
    }


APIs
----

### GET /hosts

* URL query arguments: pagination arguments.
* Body arguments: None
* Returns: list of hosts.

### GET /queues

* URL query arguments: pagination arguments.
* Body arguments: None
* Returns: list of queues.

### GET /queues/:id

* Arguments: None
* Returns: Statistics for the queue.

### POST /queues

Create a queue.

* Arguments: Name (queue ID), Host
* Returns: modification result object (see above).

### PUT /queues/:id

Update queue properties.

* Arguments (values: `true` or `false`): 
 * State: if provided, will start or stop the queue. 
 * statisticsEnabled: if provided, will enable or disable statistics collection
* Returns: modification result object (see above).

### DELETE /queues/:id

Deletes the queue.

* Arguments: None
* Returns: modification result object (see above).

