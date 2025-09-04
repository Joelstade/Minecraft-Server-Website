import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-5, 5, 20)
y = np.linspace(-5, 5, 20)
X, Y = np.meshgrid(x, y)

R = np.sqrt(X2 + Y2) + 1e-6  # avoid divide by zero

U1 = X / R2
V1 = Y / R2

U2 = X / R2
V2 = Y / R2
V2[Y > 0] = 0   # Block airflow above the fan (simulate plane)

fig, axes = plt.subplots(1, 2, figsize=(12, 6))

axes[0].quiver(X, Y, U1, V1, color="blue")
axes[0].set_title("Fan in Open Air")
axes[0].set_aspect('equal')

axes[1].quiver(X, Y, U2, V2, color="red")
axes[1].set_title("Fan Blocked by Plane")
axes[1].axhline(0, color="black", linewidth=2)  # Plane representation
axes[1].set_aspect('equal')

plt.show()