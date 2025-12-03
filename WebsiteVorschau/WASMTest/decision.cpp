// decision.cpp
#include <string>

extern "C" {
    int decision(float* times, int len) {
        for (int i = 0; i < len; ++i) {
            int time = static_cast<int>(times[i]);

            if (time % 20000 == 0) {
                return -1;
            } else if (time % 15000 == 0) {
                return 1;
            }
        }
        return 0;
    }
}

