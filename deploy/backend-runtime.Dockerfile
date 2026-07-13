FROM eclipse-temurin:17-jre

WORKDIR /app
COPY backend/target/business-security-dashboard-0.1.0.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
