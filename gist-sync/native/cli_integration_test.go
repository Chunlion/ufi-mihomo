package main

import (
	"os"
	"syscall"
	"time"
)

// Only the test executable recognizes this mode. Production has no environment override.
func integrationCLI() bool {
	if os.Getenv("F50_TEST_INTEGRATION_CLI") != "1" {
		return false
	}
	makeApp = func() *App {
		a := defaultApp()
		stage := os.Getenv("F50_TEST_PAUSE_STAGE")
		a.Hook = func(point string) error {
			if point == stage {
				if e := os.WriteFile("/test/paused", []byte(point), 0600); e != nil {
					return e
				}
				if os.Getenv("F50_TEST_WAIT_GATE") == "1" {
					for !exists("/test/release") {
						time.Sleep(10 * time.Millisecond)
					}
					return nil
				}
				if e := syscall.Kill(os.Getpid(), syscall.SIGSTOP); e != nil {
					return e
				}
				// Kill may return before the group stop is scheduled. Never let
				// the transaction run past the requested fault boundary.
				select {}
			}
			return nil
		}
		return a
	}
	main()
	return true
}
