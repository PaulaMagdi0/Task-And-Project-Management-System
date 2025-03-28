                +----------------------+
                |        users         |
                |----------------------|
                | PK: id               |
                | email                |
                | password             |
                | ... (common fields)  |
                +-----------+----------+
                            |
      +---------------------+----------------------+
      |                     |                      |
      |                     |                      |
      v                     v                      v
+--------------+     +---------------+      +--------------+
| supervisors  |     | instructors   |      |   students   |
|--------------|     |---------------|      |--------------|
| PK, FK: id   |     | PK, FK: id    |      | PK, FK: id   |
|              |     |               |      | track_id (FK)|
+--------------+     +---------------+      +------+-------+
                                                   |
                                                   v
                                             +-------------+
                                             |   tracks    |
                                             |-------------|
                                             | PK: id      |
                                             | name        |
                                             | supervisor_id (FK)  |
                                             +------+------+
                                                    |
                                                    v
                                             +-------------+
                                             |   courses   |
                                             |-------------|
                                             | PK: id      |
                                             | name        |
                                             | track_id (FK)     |
                                             | instructor_id (FK)|
                                             +------+------+
                                                    |
                                                    v
                                             +-------------+
                                             | assignments |
                                             |-------------|
                                             | PK: id      |
                                             | title       |
                                             | description |
                                             | due_date    |
                                             | assignment_type  |
                                             | course_id (FK)   |
                                             +------+------+
                                                    |
                                                    v
                                             +-------------+
                                             |   grades    |
                                             |-------------|
                                             | PK: id      |
                                             | assignment_id (FK) |
                                             | student_id (FK)    |
                                             | score       |
                                             | feedback    |
                                             | graded_date |
                                             +-------------+
