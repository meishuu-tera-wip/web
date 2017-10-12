So this was pretty dumb.

As I was making proxy modules that would include a browser interface, I didn't
want to have to repeat a lot of boilerplate and waste resources. I wasn't happy
with the idea of running a `socket.io` server in the same process as the proxy,
so I figured I'd just spawn a child process to run that for me. Then it could
also help abstract some of the IPC.

Anyway I don't remember how this works at all, but some other WIP modules still
use it so I might as well throw it in.

I don't care too much about this one. MIT license it is.
