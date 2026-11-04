#include <errno.h>
#include <stddef.h>
#include <stdio.h>
#include <unistd.h>
#include <linux/audit.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <sys/prctl.h>
#include <sys/syscall.h>
#include <sys/socket.h>
int main(int argc, char **argv) {
  if (argc < 2) return 2;
  struct sock_filter filter[] = {
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS, offsetof(struct seccomp_data, arch)),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, AUDIT_ARCH_X86_64, 1, 0),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_KILL_PROCESS),
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS, offsetof(struct seccomp_data, nr)),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, __NR_connect, 0, 1),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_ERRNO|EPERM),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, __NR_socket, 0, 4),
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS, offsetof(struct seccomp_data, args[0])),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, AF_INET, 1, 0),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K, AF_INET6, 0, 1),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_ERRNO|EPERM),
    BPF_STMT(BPF_RET|BPF_K, SECCOMP_RET_ALLOW)
  };
  struct sock_fprog prog = {sizeof(filter)/sizeof(filter[0]), filter};
  if (prctl(PR_SET_NO_NEW_PRIVS,1,0,0,0) || prctl(PR_SET_SECCOMP,SECCOMP_MODE_FILTER,&prog)) {perror("seccomp");return 2;}
  execvp(argv[1], argv+1);perror("execvp");return 2;
}
