#!/bin/bash

# Docker CLI wrapper that redirects to Finch
# This allows SAM Local to use Finch instead of Docker

# Simply pass all arguments to finch
exec finch "$@"
