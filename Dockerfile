FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY src ./src
COPY assets ./assets
COPY index.html about.html contact.html team-detail.html coming-soon.html not-found.html ./
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre
RUN groupadd --system techfiyr && useradd --system --gid techfiyr --home-dir /app techfiyr
WORKDIR /app
COPY --from=build /workspace/target/techfiyr-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p /app/uploads && chown -R techfiyr:techfiyr /app
USER techfiyr
EXPOSE 8001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
